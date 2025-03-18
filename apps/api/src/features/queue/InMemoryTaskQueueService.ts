import { Injectable, Logger } from "@nestjs/common"
import { type Observable, Subject, throwError } from "rxjs"

export class TaskRejectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TaskRejectionError"
  }
}

export interface QueueOptions {
  /**
   * Maximum number of tasks that can run in parallel
   * Set to 1 for sequential execution
   * Set to Infinity for unlimited parallel execution
   */
  maxConcurrent: number

  /**
   * Name of the queue for logging purposes
   */
  name: string

  /**
   * Whether to deduplicate tasks in the queue
   * If true, when a new task with the same id is added, the old one is removed
   */
  deduplicate?: boolean

  /**
   * Whether tasks with the same ID should run sequentially
   * If true, tasks with the same ID will wait for previous tasks with that ID to complete
   * before starting, regardless of maxConcurrent setting
   */
  sequentialTasksWithSameId?: boolean
}

export interface TaskOptions<T> {
  /**
   * Unique identifier for the task, used for deduplication
   * If not provided, the task will never be deduplicated
   */
  id?: string
}

interface QueuedTask<R> {
  id?: string
  taskFactory: () => Observable<R>
  subject: Subject<R>
  startTime?: number
}

@Injectable()
export class InMemoryTaskQueueService {
  private readonly logger = new Logger(InMemoryTaskQueueService.name)
  private queues: Map<
    string,
    {
      options: QueueOptions
      active: QueuedTask<any>[]
      pending: QueuedTask<any>[]
    }
  > = new Map()

  /**
   * Creates a new queue or returns an existing one
   */
  createQueue(options: QueueOptions): string {
    const { name, maxConcurrent } = options

    if (this.queues.has(name)) {
      this.logger.log(
        `Queue "${name}" already exists, returning existing queue`,
      )
      return name
    }

    this.queues.set(name, {
      options,
      active: [],
      pending: [],
    })

    this.logger.log(
      `Created queue "${name}" with maxConcurrent=${maxConcurrent}`,
    )
    return name
  }

  /**
   * Adds a task to the queue and returns an observable that will emit when the task completes
   * @param queueName The name of the queue
   * @param task An observable or a function that returns an observable
   * @param options Task options
   */
  enqueue<R>(
    queueName: string,
    taskFactory: () => Observable<R>,
    options: TaskOptions<any> = {},
  ): Observable<R> {
    const queue = this.queues.get(queueName)

    if (!queue) {
      return throwError(() => new Error(`Queue "${queueName}" does not exist`))
    }

    const { id } = options
    const { options: queueOptions, active, pending } = queue

    // Create a subject that will emit the task result
    const subject = new Subject<R>()

    // Create the task object
    const queuedTask: QueuedTask<R> = {
      id,
      taskFactory,
      subject,
    }

    // If deduplication is enabled and the task has an ID, check for duplicates
    if (queueOptions.deduplicate && id) {
      // Check if a task with the same ID is already in the pending queue
      const existingTaskIndex = pending.findIndex((task) => task.id === id)

      if (existingTaskIndex !== -1) {
        // Remove the existing task and reject its subject
        const existingTask = pending.splice(existingTaskIndex, 1)[0]
        existingTask?.subject.error(
          new TaskRejectionError(`Task ${id} was replaced by a newer task`),
        )
        this.logger.log(`Replaced pending task ${id} in queue "${queueName}"`)
      }
    }

    // Add the task to the pending queue
    pending.push(queuedTask)

    this.logger.log(`Added task${id ? ` ${id}` : ""} to queue "${queueName}"`)

    // Try to process tasks
    this.processNextTasks(queueName)

    // Return an observable that will emit the task result
    return subject.asObservable()
  }

  /**
   * Gets statistics about a queue
   */
  getQueueStats(queueName: string) {
    const queue = this.queues.get(queueName)

    if (!queue) {
      return null
    }

    const { options, active, pending } = queue

    return {
      name: options.name,
      maxConcurrent: options.maxConcurrent,
      activeCount: active.length,
      pendingCount: pending.length,
      activeTasks: active.map((task) => ({
        id: task.id,
        runningTime: task.startTime ? Date.now() - task.startTime : 0,
      })),
      pendingTasks: pending.map((task) => ({
        id: task.id,
      })),
    }
  }

  /**
   * Gets statistics about all queues
   */
  getAllQueueStats() {
    const stats: Record<string, any> = {}

    for (const [name] of this.queues) {
      stats[name] = this.getQueueStats(name)
    }

    return stats
  }

  /**
   * Clears all pending tasks from a queue
   */
  clearQueue(queueName: string): boolean {
    const queue = this.queues.get(queueName)

    if (!queue) {
      return false
    }

    // Reject all pending tasks
    for (const task of queue.pending) {
      task.subject.error(
        new Error(`Task was cleared from queue "${queueName}"`),
      )
    }

    // Clear the pending queue
    queue.pending = []

    this.logger.log(`Cleared all pending tasks from queue "${queueName}"`)
    return true
  }

  /**
   * Processes the next tasks in the queue if possible
   */
  private processNextTasks(queueName: string): void {
    const queue = this.queues.get(queueName)

    if (!queue) {
      return
    }

    const { options, active, pending } = queue

    // Process as many tasks as possible
    while (pending.length > 0 && active.length < options.maxConcurrent) {
      // Get the next task (FIFO order)
      const nextTaskIndex = this.findNextTaskIndex(queue)

      // If no suitable task was found, break the loop
      if (nextTaskIndex === -1) {
        break
      }

      // Remove the task from pending and add it to active
      // This is safe because we've checked the index is valid
      const nextTask = pending.splice(nextTaskIndex, 1)[0]

      // This should never happen, but check just to be safe
      if (!nextTask) {
        this.logger.error(
          `Unexpected error: Task at index ${nextTaskIndex} is undefined`,
        )
        continue
      }

      // Add it to the active queue
      nextTask.startTime = Date.now()
      active.push(nextTask)

      this.logger.log(
        `Starting task${nextTask.id ? ` ${nextTask.id}` : ""} from queue "${queueName}"`,
      )

      try {
        // Create a fresh observable from the factory
        const taskObservable = nextTask.taskFactory()

        // Subscribe to the task observable and forward emissions to the subject
        const subscription = taskObservable.subscribe({
          next: (result) => {
            this.logger.debug(`Task ${nextTask.id || "unknown"} emitted result`)
            nextTask.subject.next(result)
          },
          error: (error) => {
            this.logger.error(
              `Task ${nextTask.id || "unknown"} error: ${error.message}`,
            )
            this.logger.error(error)
            nextTask.subject.error(error)

            // Remove from active queue
            const index = active.indexOf(nextTask)
            if (index !== -1) {
              active.splice(index, 1)
            }

            // Process next tasks
            this.processNextTasks(queueName)
          },
          complete: () => {
            this.logger.debug(`Task ${nextTask.id || "unknown"} completed`)
            nextTask.subject.complete()

            // Remove from active queue
            const index = active.indexOf(nextTask)
            if (index !== -1) {
              active.splice(index, 1)
            }

            // Process next tasks
            this.processNextTasks(queueName)
          },
        })

        // Add cleanup logic when the subject is unsubscribed
        nextTask.subject.subscribe({
          complete: () => {
            subscription.unsubscribe()
          },
          error: () => {
            subscription.unsubscribe()
          },
        })
      } catch (error: any) {
        this.logger.error(`Error executing task: ${error.message}`)
        nextTask.subject.error(error)

        // Remove from active queue
        const index = active.indexOf(nextTask)
        if (index !== -1) {
          active.splice(index, 1)
        }

        // Process next tasks
        this.processNextTasks(queueName)
      }
    }
  }

  /**
   * Finds the index of the next task to process
   * Takes into account the sequentialTasksWithSameId option
   */
  private findNextTaskIndex(queue: {
    options: QueueOptions
    active: QueuedTask<any>[]
    pending: QueuedTask<any>[]
  }): number {
    const { options, active, pending } = queue

    // If sequentialTasksWithSameId is not enabled, just return the first task
    if (!options.sequentialTasksWithSameId) {
      return pending.length > 0 ? 0 : -1
    }

    // Get the IDs of tasks that are currently active
    const activeTaskIds = active
      .map((task) => task.id)
      .filter((id): id is string => id !== undefined)

    // Find the first task that doesn't have an active task with the same ID
    for (let i = 0; i < pending.length; i++) {
      const pendingTask = pending[i]

      // Skip undefined tasks (should never happen)
      if (!pendingTask) {
        continue
      }

      // If the task has no ID or its ID is not in the active tasks, it can be processed
      if (!pendingTask.id || !activeTaskIds.includes(pendingTask.id)) {
        return i
      }
    }

    // No suitable task found
    return -1
  }
}

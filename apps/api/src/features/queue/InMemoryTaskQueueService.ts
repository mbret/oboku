import { Injectable, Logger } from "@nestjs/common"
import { Observable, Subject, defer, from, throwError } from "rxjs"
import { finalize, tap, share, takeUntil } from "rxjs/operators"

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
}

export interface TaskOptions<T> {
  /**
   * Unique identifier for the task, used for deduplication
   * If not provided, the task will never be deduplicated
   */
  id?: string

  /**
   * Optional context data to be passed to the task
   */
  context?: T
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
    task: Observable<R> | (() => Observable<R>),
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

    // Create a factory function that will create the observable when needed
    const taskFactory = () => {
      // If task is already an observable, wrap it in a defer to ensure fresh execution
      // If task is a function, it will be called when the observable is subscribed to
      return typeof task === "function" ? defer(task) : defer(() => task)
    }

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
          new Error(`Task ${id} was replaced by a newer task`),
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
      const nextTask = pending.shift()

      if (!nextTask) {
        break
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
}

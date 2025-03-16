import { Test, TestingModule } from "@nestjs/testing"
import {
  InMemoryTaskQueueService,
  TaskRejectionError,
} from "./InMemoryTaskQueueService"
import { defer, firstValueFrom, lastValueFrom, Observable, timer } from "rxjs"
import { finalize, map, delay } from "rxjs/operators"

let service: InMemoryTaskQueueService

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [InMemoryTaskQueueService],
  }).compile()

  service = module.get<InMemoryTaskQueueService>(InMemoryTaskQueueService)
})

it("should be defined", () => {
  expect(service).toBeDefined()
})

describe("max concurrency", () => {
  it("should execute tasks in parallel up to the max concurrency limit", async () => {
    // Create a queue with max concurrency of 2
    const queueName = "test-parallel"
    service.createQueue({
      name: queueName,
      maxConcurrent: 2,
    })

    const executionOrder: string[] = []

    // Create a task that records when it starts and completes
    const createTask = (id: string, duration: number) => {
      return () =>
        defer(() => {
          executionOrder.push(`${id}-start`)

          return timer(duration).pipe(
            map(() => {
              return id
            }),
            finalize(() => {
              executionOrder.push(`${id}-end`)
            }),
          )
        })
    }

    // Enqueue 3 tasks with different durations
    const task1$ = service.enqueue(queueName, createTask("task1", 100))
    const task2$ = service.enqueue(queueName, createTask("task2", 50))
    const task3$ = service.enqueue(queueName, createTask("task3", 75))

    // Wait for all tasks to complete with a timeout

    // Use Promise.all to wait for all tasks to complete
    const [result1, result2, result3] = await Promise.all([
      firstValueFrom(task1$),
      firstValueFrom(task2$),
      firstValueFrom(task3$),
    ])

    // Verify individual results
    expect(result1).toBe("task1")
    expect(result2).toBe("task2")
    expect(result3).toBe("task3")

    // Verify execution order:
    // - task1 and task2 should start immediately (in parallel)
    // - task2 should end first (shortest duration)
    // - task3 should start after task2 ends (since max concurrency is 2)
    // - task1 should end after task3 starts (longest duration)
    // - task3 should end last
    expect(executionOrder).toEqual([
      "task1-start",
      "task2-start",
      "task2-end",
      "task3-start",
      "task1-end",
      "task3-end",
    ])
  })

  it("should execute tasks sequentially when maxConcurrent is 1", async () => {
    // Create a queue with max concurrency of 1
    const queueName = "test-sequential"
    service.createQueue({
      name: queueName,
      maxConcurrent: 1,
    })

    // Track execution order
    const executionOrder: string[] = []

    // Create a task that records its execution
    const createTask = (id: string, duration: number) => {
      return () =>
        defer(() => {
          executionOrder.push(`${id}-start`)
          return timer(duration).pipe(
            map(() => id),
            finalize(() => {
              executionOrder.push(`${id}-end`)
            }),
          )
        })
    }

    // Enqueue 3 tasks
    const task1$ = service.enqueue(queueName, createTask("task1", 50))
    const task2$ = service.enqueue(queueName, createTask("task2", 50))
    const task3$ = service.enqueue(queueName, createTask("task3", 50))

    // Wait for all tasks to complete
    const [result1, result2, result3] = await Promise.all([
      firstValueFrom(task1$),
      firstValueFrom(task2$),
      firstValueFrom(task3$),
    ])

    // Verify results
    expect(result1).toBe("task1")
    expect(result2).toBe("task2")
    expect(result3).toBe("task3")

    // Verify sequential execution
    expect(executionOrder).toEqual([
      "task1-start",
      "task1-end",
      "task2-start",
      "task2-end",
      "task3-start",
      "task3-end",
    ])
  })

  it("should deduplicate tasks with the same ID in the queue", async () => {
    // Create a queue with deduplication enabled and limited concurrency
    const queueName = "test-deduplication"
    service.createQueue({
      name: queueName,
      maxConcurrent: 1, // Only one task at a time to ensure tasks queue up
      deduplicate: true, // Enable deduplication
    })

    // Track which tasks were executed
    const executedTasks: string[] = []

    // Create tasks with different values but same ID
    const createTask = (taskId: string, value: string, duration = 100) => {
      return () =>
        defer(() => {
          executedTasks.push(taskId)
          // Use a timer to simulate async work
          return timer(duration).pipe(map(() => value))
        })
    }

    // Fill the queue with a long-running task to ensure subsequent tasks are queued
    const blockingTask$ = service.enqueue(
      queueName,
      createTask("blocking", "blocking-value", 300),
      { id: "blocking-id" },
    )

    // Enqueue first task with ID "same-id" - this will be queued behind the blocking task
    const task1$ = service.enqueue(
      queueName,
      createTask("task1", "original-value"),
      { id: "same-id" },
    )

    // Enqueue second task with same ID - this should replace the first task in the queue
    const task2$ = service.enqueue(
      queueName,
      createTask("task2", "updated-value"),
      { id: "same-id" },
    )

    // Enqueue third task with different ID - this should be processed normally
    const task3$ = service.enqueue(
      queueName,
      createTask("task3", "different-id-value"),
      { id: "different-id" },
    )

    // Set up error handler for task1 (should be rejected)
    let task1Error: Error | null = null
    let task1ErrorMessage = ""

    task1$.subscribe({
      error: (err: any) => {
        task1Error = new Error(err?.message || "Unknown error")
        task1ErrorMessage = err?.message || ""
      },
    })

    // Wait for all tasks to complete
    const blockingResult = await firstValueFrom(blockingTask$)
    const result2 = await firstValueFrom(task2$)
    const result3 = await firstValueFrom(task3$)

    // Verify task1 was rejected with appropriate error
    expect(task1Error).not.toBeNull()
    expect(task1ErrorMessage).toContain("replaced by a newer task")

    // Verify other tasks completed successfully with correct values
    expect(blockingResult).toBe("blocking-value")
    expect(result2).toBe("updated-value")
    expect(result3).toBe("different-id-value")

    // Verify which tasks were executed
    expect(executedTasks).toContain("blocking")
    expect(executedTasks).toContain("task2")
    expect(executedTasks).toContain("task3")
    expect(executedTasks).not.toContain("task1") // task1 should not be executed

    // Verify queue stats
    const stats = service.getQueueStats(queueName)
    expect(stats?.activeCount).toBe(0)
    expect(stats?.pendingCount).toBe(0)
  }, 10000) // Increase timeout to 10 seconds
})

describe("deduplication", () => {
  describe("Given a queue with a max concurrency of 1", () => {
    describe("and 3 tasks are enqueued with the same ID", () => {
      it("should only process the first and last task, discarding the middle one", async () => {
        const queueName = "test-deduplication"

        service.createQueue({
          name: queueName,
          maxConcurrent: 1,
          deduplicate: true,
        })

        const executionOrder: string[] = []

        const createTask = (id: string, duration: number) => {
          return () => {
            executionOrder.push(`${id}-start`)

            return timer(duration).pipe(
              map(() => {
                executionOrder.push(`${id}-end`)

                return id
              }),
            )
          }
        }

        const task1$ = service.enqueue(queueName, createTask("task1", 100), {
          id: "same-id",
        })
        const task2$ = service.enqueue(queueName, createTask("task2", 100), {
          id: "same-id",
        })
        const task3$ = service.enqueue(queueName, createTask("task3", 100), {
          id: "same-id",
        })

        task1$.subscribe()
        task2$.subscribe({
          error: (err: any) => {
            executionOrder.push("task2-error")
            expect(err).toBeInstanceOf(TaskRejectionError)
          },
        })

        await lastValueFrom(task3$)

        expect(executionOrder).toEqual([
          "task1-start",
          "task2-error",
          "task1-end",
          "task3-start",
          "task3-end",
        ])
      })
    })
  })
})

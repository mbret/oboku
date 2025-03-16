import { Test, TestingModule } from "@nestjs/testing"
import { InMemoryTaskQueueService } from "./InMemoryTaskQueueService"
import { defer, firstValueFrom, Observable, timer } from "rxjs"
import { finalize, map } from "rxjs/operators"

describe("InMemoryTaskQueueService", () => {
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
      const createTask = (id: string, duration: number): Observable<string> => {
        return defer(() => {
          console.log(`Task ${id} started`)
          executionOrder.push(`${id}-start`)

          return timer(duration).pipe(
            map(() => {
              console.log(`Task ${id} emitting value`)
              return id
            }),
            finalize(() => {
              console.log(`Task ${id} finalized`)
              executionOrder.push(`${id}-end`)
            }),
          )
        })
      }

      // Enqueue 3 tasks with different durations
      console.log("Enqueueing task1")
      const task1$ = service.enqueue(queueName, createTask("task1", 100))
      console.log("Enqueueing task2")
      const task2$ = service.enqueue(queueName, createTask("task2", 50))
      console.log("Enqueueing task3")
      const task3$ = service.enqueue(queueName, createTask("task3", 75))

      // Add subscriptions to track values
      // task1$.subscribe((value) => console.log(`task1$ emitted: ${value}`))
      // task2$.subscribe((value) => console.log(`task2$ emitted: ${value}`))
      // task3$.subscribe((value) => console.log(`task3$ emitted: ${value}`))

      // Wait for all tasks to complete with a timeout
      console.log("Waiting for tasks to complete...")

      // Use Promise.all to wait for all tasks to complete
      const [result1, result2, result3] = await Promise.all([
        firstValueFrom(task1$),
        firstValueFrom(task2$),
        firstValueFrom(task3$),
      ])

      console.log("All tasks completed")
      console.log({ result1, result2, result3, executionOrder })

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
      const createTask = (id: string, duration: number): Observable<string> => {
        return defer(() => {
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
  })
})

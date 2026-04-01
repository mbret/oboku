import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { NotificationKind, NotificationSeverity } from "@oboku/shared"
import type { DeepPartial, Repository } from "typeorm"
import {
  NotificationDeliveryPostgresEntity,
  NotificationPostgresEntity,
} from "./entities"

export type AdminNotificationRow = {
  notification_id: number
  notification_created_at: Date
  notification_severity: NotificationSeverity
  notification_title: string
  notification_body: string | null
  delivered_count: string
}

export type UserNotificationRow = {
  notification_id: number
  notification_created_at: Date
  notification_kind: NotificationKind
  notification_severity: NotificationSeverity
  notification_title: string
  notification_body: string | null
  notification_data: unknown
  delivery_seen_at: Date | null
  delivery_archived_at: Date | null
}

@Injectable()
export class NotificationPostgresService {
  constructor(
    @InjectRepository(NotificationPostgresEntity)
    private readonly notificationRepository: Repository<NotificationPostgresEntity>,
    @InjectRepository(NotificationDeliveryPostgresEntity)
    private readonly notificationDeliveryRepository: Repository<NotificationDeliveryPostgresEntity>,
  ) {}

  async saveNotification(
    data: DeepPartial<NotificationPostgresEntity>,
  ): Promise<NotificationPostgresEntity> {
    return this.notificationRepository.save(
      this.notificationRepository.create(data),
    )
  }

  async getUserNotificationRows({
    userId,
  }: {
    userId: number
  }): Promise<UserNotificationRow[]> {
    return this.notificationDeliveryRepository
      .createQueryBuilder("delivery")
      .innerJoin(
        NotificationPostgresEntity,
        "notification",
        "notification.id = delivery.notification_id",
      )
      .select([
        "notification.id AS notification_id",
        "notification.created_at AS notification_created_at",
        "notification.kind AS notification_kind",
        "notification.severity AS notification_severity",
        "notification.title AS notification_title",
        "notification.body AS notification_body",
        "notification.data AS notification_data",
        "delivery.seen_at AS delivery_seen_at",
        "delivery.archived_at AS delivery_archived_at",
      ])
      .where("delivery.user_id = :userId", { userId })
      .andWhere("delivery.archived_at IS NULL")
      .orderBy("notification.created_at", "DESC")
      .getRawMany<UserNotificationRow>()
  }

  async markNotificationAsSeen({
    notificationId,
    userId,
  }: {
    notificationId: number
    userId: number
  }) {
    await this.notificationDeliveryRepository
      .createQueryBuilder()
      .update(NotificationDeliveryPostgresEntity)
      .set({
        seen_at: () => "CURRENT_TIMESTAMP",
      })
      .where("notification_id = :notificationId", { notificationId })
      .andWhere("user_id = :userId", { userId })
      .andWhere("seen_at IS NULL")
      .execute()
  }

  async markAllNotificationsAsSeen({ userId }: { userId: number }) {
    await this.notificationDeliveryRepository
      .createQueryBuilder()
      .update(NotificationDeliveryPostgresEntity)
      .set({
        seen_at: () => "CURRENT_TIMESTAMP",
      })
      .where("user_id = :userId", { userId })
      .andWhere("archived_at IS NULL")
      .andWhere("seen_at IS NULL")
      .execute()
  }

  async archiveNotification({
    notificationId,
    userId,
  }: {
    notificationId: number
    userId: number
  }) {
    await this.notificationDeliveryRepository
      .createQueryBuilder()
      .update(NotificationDeliveryPostgresEntity)
      .set({
        archived_at: () => "CURRENT_TIMESTAMP",
      })
      .where("notification_id = :notificationId", { notificationId })
      .andWhere("user_id = :userId", { userId })
      .andWhere("archived_at IS NULL")
      .execute()
  }

  async getAdminBroadcastRows(): Promise<AdminNotificationRow[]> {
    return this.notificationRepository
      .createQueryBuilder("notification")
      .leftJoin(
        NotificationDeliveryPostgresEntity,
        "delivery",
        "delivery.notification_id = notification.id",
      )
      .select([
        "notification.id AS notification_id",
        "notification.created_at AS notification_created_at",
        "notification.severity AS notification_severity",
        "notification.title AS notification_title",
        "notification.body AS notification_body",
        "COUNT(delivery.id) AS delivered_count",
      ])
      .where("notification.kind = :kind", { kind: "admin_broadcast" })
      .groupBy("notification.id")
      .addGroupBy("notification.created_at")
      .addGroupBy("notification.severity")
      .addGroupBy("notification.title")
      .addGroupBy("notification.body")
      .orderBy("notification.created_at", "DESC")
      .limit(50)
      .getRawMany<AdminNotificationRow>()
  }

  async createDeliveries({
    notificationId,
    userIds,
  }: {
    notificationId: number
    userIds: number[]
  }) {
    if (userIds.length === 0) {
      return
    }

    await this.notificationDeliveryRepository.save(
      userIds.map((userId) =>
        this.notificationDeliveryRepository.create({
          notification_id: notificationId,
          user_id: userId,
          seen_at: null,
          archived_at: null,
        }),
      ),
      {
        chunk: 200,
      },
    )
  }
}

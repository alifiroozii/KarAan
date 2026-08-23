package com.karvin.app.domain.usecase.notification

import com.karvin.app.domain.model.NotificationItem
import com.karvin.app.domain.repository.NotificationRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetNotificationsUseCase @Inject constructor(
    private val notificationRepository: NotificationRepository
) {
    operator fun invoke(userId: String): Flow<List<NotificationItem>> {
        return notificationRepository.getNotifications(userId)
    }

    fun getUnreadCount(userId: String): Flow<Int> {
        return notificationRepository.getUnreadCount(userId)
    }
}

class MarkNotificationReadUseCase @Inject constructor(
    private val notificationRepository: NotificationRepository
) {
    suspend operator fun invoke(notificationId: String): Resource<Boolean> {
        return notificationRepository.markAsRead(notificationId)
    }

    suspend fun markAllAsRead(userId: String): Resource<Boolean> {
        return notificationRepository.markAllAsRead(userId)
    }
}

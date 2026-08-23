package com.karvin.app.domain.repository

import com.karvin.app.domain.model.NotificationItem
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface NotificationRepository {
    fun getNotifications(userId: String): Flow<List<NotificationItem>>
    suspend fun markAsRead(notificationId: String): Resource<Boolean>
    suspend fun markAllAsRead(userId: String): Resource<Boolean>
    fun getUnreadCount(userId: String): Flow<Int>
}

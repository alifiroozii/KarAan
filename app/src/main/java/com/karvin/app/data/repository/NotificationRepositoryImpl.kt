package com.karvin.app.data.repository

import com.karvin.app.data.local.KarvinDatabase
import com.karvin.app.data.mapper.toDomain
import com.karvin.app.domain.model.NotificationItem
import com.karvin.app.domain.repository.NotificationRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepositoryImpl @Inject constructor(
    private val database: KarvinDatabase
) : NotificationRepository {

    override fun getNotifications(userId: String): Flow<List<NotificationItem>> {
        return database.notificationDao().getNotifications(userId).map { list ->
            list.map { it.toDomain() }
        }
    }

    override suspend fun markAsRead(notificationId: String): Resource<Boolean> {
        database.notificationDao().markAsRead(notificationId)
        return Resource.Success(true)
    }

    override suspend fun markAllAsRead(userId: String): Resource<Boolean> {
        database.notificationDao().markAllAsRead(userId)
        return Resource.Success(true)
    }

    override fun getUnreadCount(userId: String): Flow<Int> {
        return database.notificationDao().getUnreadCount(userId)
    }
}

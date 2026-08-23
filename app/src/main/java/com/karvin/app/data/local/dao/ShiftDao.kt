package com.karvin.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.karvin.app.data.local.entity.NotificationEntity
import com.karvin.app.data.local.entity.RatingEntity
import com.karvin.app.data.local.entity.ShiftEntity
import com.karvin.app.domain.model.ShiftStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface ShiftDao {
    @Query("SELECT * FROM shifts WHERE workerId = :workerId ORDER BY date ASC, startTime ASC")
    fun getWorkerShifts(workerId: String): Flow<List<ShiftEntity>>

    @Query("SELECT * FROM shifts WHERE employerId = :employerId ORDER BY date ASC, startTime ASC")
    fun getEmployerShifts(employerId: String): Flow<List<ShiftEntity>>

    @Query("SELECT * FROM shifts WHERE id = :shiftId")
    suspend fun getShiftById(shiftId: String): ShiftEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShift(shift: ShiftEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShifts(shifts: List<ShiftEntity>)

    @Update
    suspend fun updateShift(shift: ShiftEntity)

    @Query("UPDATE shifts SET status = :status WHERE id = :shiftId")
    suspend fun updateStatus(shiftId: String, status: ShiftStatus)
}

@Dao
interface NotificationDao {
    @Query("SELECT * FROM notifications WHERE userId = :userId ORDER BY timestamp DESC")
    fun getNotifications(userId: String): Flow<List<NotificationEntity>>

    @Query("SELECT COUNT(*) FROM notifications WHERE userId = :userId AND isRead = 0")
    fun getUnreadCount(userId: String): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(notification: NotificationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotifications(notifications: List<NotificationEntity>)

    @Query("UPDATE notifications SET isRead = 1 WHERE id = :notificationId")
    suspend fun markAsRead(notificationId: String)

    @Query("UPDATE notifications SET isRead = 1 WHERE userId = :userId")
    suspend fun markAllAsRead(userId: String)
}

@Dao
interface RatingDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRating(rating: RatingEntity)

    @Query("SELECT * FROM ratings WHERE targetUserId = :userId ORDER BY createdAt DESC")
    fun getRatingsForUser(userId: String): Flow<List<RatingEntity>>
}

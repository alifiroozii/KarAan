package com.karvin.app.data.database

import androidx.room.Dao
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "cached_jobs")
data class CachedJobEntity(
    @androidx.room.PrimaryKey val id: String,
    val title: String,
    val category: String,
    val amount: Long,
    val latitude: Double,
    val longitude: Double,
    val payload: String,
    val cachedAt: Long = System.currentTimeMillis(),
)

@Entity(tableName = "cached_workers")
data class CachedWorkerEntity(
    @androidx.room.PrimaryKey val id: String,
    val name: String,
    val skillSummary: String,
    val rating: Double,
    val latitude: Double,
    val longitude: Double,
    val payload: String,
    val cachedAt: Long = System.currentTimeMillis(),
)

@Entity(tableName = "cached_messages")
data class CachedMessageEntity(
    @androidx.room.PrimaryKey val id: String,
    val conversationId: String,
    val senderId: String,
    val text: String,
    val sentAt: Long,
    val isSeen: Boolean,
)

@Entity(tableName = "favorites")
data class FavoriteEntity(
    @androidx.room.PrimaryKey val id: String,
    val type: String,
    val targetId: String,
    val createdAt: Long = System.currentTimeMillis(),
)

@Dao
interface KarvinDao {
    @Query("SELECT * FROM cached_jobs ORDER BY cachedAt DESC")
    fun observeCachedJobs(): Flow<List<CachedJobEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertJobs(items: List<CachedJobEntity>)

    @Query("SELECT * FROM cached_workers ORDER BY cachedAt DESC")
    fun observeCachedWorkers(): Flow<List<CachedWorkerEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertWorkers(items: List<CachedWorkerEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMessages(items: List<CachedMessageEntity>)

    @Query("SELECT * FROM cached_messages WHERE conversationId = :conversationId ORDER BY sentAt ASC")
    fun observeMessages(conversationId: String): Flow<List<CachedMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertFavorite(item: FavoriteEntity)

    @Query("DELETE FROM favorites WHERE type = :type AND targetId = :targetId")
    suspend fun deleteFavorite(type: String, targetId: String)

    @Query("SELECT EXISTS(SELECT 1 FROM favorites WHERE type = :type AND targetId = :targetId)")
    suspend fun isFavorite(type: String, targetId: String): Boolean
}

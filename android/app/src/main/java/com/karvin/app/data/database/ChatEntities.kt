package com.karvin.app.data.database

import androidx.room.Dao
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ChatMessageDao {
    @Query("SELECT * FROM cached_messages WHERE conversationId = :conversationId ORDER BY sentAt ASC")
    fun observe(conversationId: String): Flow<List<CachedMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(message: CachedMessageEntity)
}

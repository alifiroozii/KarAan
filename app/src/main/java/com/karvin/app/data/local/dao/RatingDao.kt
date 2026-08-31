package com.karvin.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.karvin.app.data.local.entity.RatingEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RatingDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRating(rating: RatingEntity)

    @Query("SELECT * FROM ratings WHERE targetUserId = :userId ORDER BY createdAt DESC")
    fun getRatingsForUser(userId: String): Flow<List<RatingEntity>>
}

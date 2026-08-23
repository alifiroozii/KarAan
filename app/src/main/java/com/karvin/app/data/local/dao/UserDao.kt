package com.karvin.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.karvin.app.data.local.entity.EmployerProfileEntity
import com.karvin.app.data.local.entity.UserEntity
import com.karvin.app.data.local.entity.WorkerProfileEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM users LIMIT 1")
    fun getActiveUser(): Flow<UserEntity?>

    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getUserById(userId: String): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Update
    suspend fun updateUser(user: UserEntity)

    @Query("DELETE FROM users")
    suspend fun clearUsers()

    // Worker Profile
    @Query("SELECT * FROM worker_profiles WHERE userId = :userId")
    fun getWorkerProfile(userId: String): Flow<WorkerProfileEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorkerProfile(profile: WorkerProfileEntity)

    @Query("UPDATE worker_profiles SET isAvailableForWork = :isAvailable WHERE userId = :userId")
    suspend fun updateWorkerAvailability(userId: String, isAvailable: Boolean)

    // Employer Profile
    @Query("SELECT * FROM employer_profiles WHERE userId = :userId")
    fun getEmployerProfile(userId: String): Flow<EmployerProfileEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEmployerProfile(profile: EmployerProfileEntity)
}

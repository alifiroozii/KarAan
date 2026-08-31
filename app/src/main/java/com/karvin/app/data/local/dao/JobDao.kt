package com.karvin.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.karvin.app.data.local.entity.JobEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface JobDao {
    @Query("SELECT * FROM jobs ORDER BY isUrgent DESC, createdAt DESC")
    fun getAllJobs(): Flow<List<JobEntity>>

    @Query("SELECT * FROM jobs WHERE isUrgent = 1 ORDER BY createdAt DESC")
    fun getUrgentJobs(): Flow<List<JobEntity>>

    @Query("SELECT * FROM jobs WHERE id = :jobId")
    fun getJobById(jobId: String): Flow<JobEntity?>

    @Query("SELECT * FROM jobs WHERE id = :jobId LIMIT 1")
    suspend fun getJobByIdDirect(jobId: String): JobEntity?

    @Query("SELECT * FROM jobs WHERE employerId = :employerId ORDER BY createdAt DESC")
    fun getEmployerJobs(employerId: String): Flow<List<JobEntity>>

    @Query("SELECT * FROM jobs WHERE (:city IS NULL OR city = :city) AND (:categoryId IS NULL OR categoryId = :categoryId) AND (:query IS NULL OR (title LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%')) ORDER BY createdAt DESC")
    fun searchJobs(city: String?, categoryId: String?, query: String?): Flow<List<JobEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJob(job: JobEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJobs(jobs: List<JobEntity>)

    @Update
    suspend fun updateJob(job: JobEntity)

    @Query("UPDATE jobs SET hasApplied = :hasApplied WHERE id = :jobId")
    suspend fun updateJobAppliedStatus(jobId: String, hasApplied: Boolean)

    @Query("UPDATE jobs SET hasApplied = :hasApplied WHERE id = :jobId")
    suspend fun updateApplicationStatus(jobId: String, hasApplied: Boolean)

    @Query("DELETE FROM jobs")
    suspend fun clearJobs()
}

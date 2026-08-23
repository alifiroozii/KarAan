package com.karvin.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.karvin.app.data.local.entity.JobApplicationEntity
import com.karvin.app.domain.model.ApplicationStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface JobApplicationDao {
    @Query("SELECT * FROM job_applications WHERE workerId = :workerId ORDER BY appliedAt DESC")
    fun getWorkerApplications(workerId: String): Flow<List<JobApplicationEntity>>

    @Query("SELECT * FROM job_applications WHERE employerId = :employerId AND (:jobId IS NULL OR jobId = :jobId) ORDER BY appliedAt DESC")
    fun getEmployerApplications(employerId: String, jobId: String?): Flow<List<JobApplicationEntity>>

    @Query("SELECT * FROM job_applications WHERE id = :applicationId")
    suspend fun getApplicationById(applicationId: String): JobApplicationEntity?

    @Query("SELECT * FROM job_applications WHERE workerId = :workerId AND jobId = :jobId LIMIT 1")
    suspend fun getApplicationByWorkerAndJob(workerId: String, jobId: String): JobApplicationEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApplication(application: JobApplicationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApplications(applications: List<JobApplicationEntity>)

    @Update
    suspend fun updateApplication(application: JobApplicationEntity)

    @Query("UPDATE job_applications SET status = :status WHERE id = :applicationId")
    suspend fun updateStatus(applicationId: String, status: ApplicationStatus)
}

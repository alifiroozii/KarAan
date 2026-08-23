package com.karvin.app.domain.repository

import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.model.Skill
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface WorkerRepository {
    fun getWorkerProfile(userId: String): Flow<WorkerProfile?>
    suspend fun updateWorkerProfile(profile: WorkerProfile): Resource<WorkerProfile>
    suspend fun toggleAvailability(userId: String, isAvailable: Boolean): Resource<Boolean>
    fun getAvailableCategories(): Flow<List<JobCategory>>
    fun getAvailableSkills(categoryId: String? = null): Flow<List<Skill>>
    fun getWorkerApplications(workerId: String): Flow<List<JobApplication>>
    suspend fun applyForJob(workerId: String, jobId: String): Resource<JobApplication>
    fun getWorkerShifts(workerId: String): Flow<List<Shift>>
    suspend fun updateShiftStatus(shiftId: String, status: com.karvin.app.domain.model.ShiftStatus): Resource<Shift>
}

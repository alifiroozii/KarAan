package com.karvin.app.data.repository

import com.karvin.app.data.local.KarvinDatabase
import com.karvin.app.data.local.entity.JobApplicationEntity
import com.karvin.app.data.mapper.toDomain
import com.karvin.app.data.mapper.toEntity
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.domain.model.Skill
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WorkerRepositoryImpl @Inject constructor(
    private val database: KarvinDatabase
) : WorkerRepository {

    override fun getWorkerProfile(userId: String): Flow<WorkerProfile?> {
        return database.userDao().getWorkerProfile(userId).map { it?.toDomain() }
    }

    override suspend fun updateWorkerProfile(profile: WorkerProfile): Resource<WorkerProfile> {
        database.userDao().insertWorkerProfile(profile.toEntity())
        return Resource.Success(profile)
    }

    override suspend fun toggleAvailability(userId: String, isAvailable: Boolean): Resource<Boolean> {
        database.userDao().updateWorkerAvailability(userId, isAvailable)
        return Resource.Success(isAvailable)
    }

    override fun getAvailableCategories(): Flow<List<JobCategory>> {
        return flowOf(FakeDataGenerator.categories)
    }

    override fun getAvailableSkills(categoryId: String?): Flow<List<Skill>> {
        val list = if (categoryId != null) {
            FakeDataGenerator.skills.filter { it.categoryId == categoryId }
        } else {
            FakeDataGenerator.skills
        }
        return flowOf(list)
    }

    override fun getWorkerApplications(workerId: String): Flow<List<JobApplication>> {
        return database.applicationDao().getWorkerApplications(workerId).map { list ->
            list.map { it.toDomain() }
        }
    }

    override suspend fun applyForJob(workerId: String, jobId: String): Resource<JobApplication> {
        delay(600)
        val job = database.jobDao().getJobById(jobId).firstOrNull() ?: return Resource.Error("فرصت شغلی یافت نشد")
        val worker = database.userDao().getWorkerProfile(workerId).firstOrNull() ?: return Resource.Error("پروفایل کارگر یافت نشد")

        val application = JobApplicationEntity(
            id = "app_${UUID.randomUUID().toString().take(8)}",
            jobId = job.id,
            jobTitle = job.title,
            workerId = worker.userId,
            workerName = worker.fullName,
            workerAvatarUrl = worker.avatarUrl,
            workerRating = worker.rating,
            workerSkills = worker.skills.map { it.nameFa },
            workerExperienceYears = worker.experienceYears,
            employerId = job.employerId,
            businessName = job.businessName,
            salaryToman = job.salaryToman,
            jobDate = job.date,
            status = ApplicationStatus.PENDING,
            appliedAt = System.currentTimeMillis(),
            rejectionReason = null
        )

        database.applicationDao().insertApplication(application)
        database.jobDao().updateJobAppliedStatus(jobId, true)

        return Resource.Success(application.toDomain())
    }

    override fun getWorkerShifts(workerId: String): Flow<List<Shift>> {
        return database.shiftDao().getWorkerShifts(workerId).map { list ->
            list.map { it.toDomain() }
        }
    }

    override suspend fun updateShiftStatus(shiftId: String, status: ShiftStatus): Resource<Shift> {
        database.shiftDao().updateStatus(shiftId, status)
        val updated = database.shiftDao().getShiftById(shiftId) ?: return Resource.Error("شیفت یافت نشد")
        return Resource.Success(updated.toDomain())
    }
}

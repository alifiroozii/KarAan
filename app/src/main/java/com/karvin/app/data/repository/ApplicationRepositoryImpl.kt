package com.karvin.app.data.repository

import com.karvin.app.data.local.dao.JobApplicationDao
import com.karvin.app.data.local.dao.JobDao
import com.karvin.app.data.local.entity.JobApplicationEntity
import com.karvin.app.data.mapper.toDomain
import com.karvin.app.data.mapper.toEntity
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.repository.ApplicationRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApplicationRepositoryImpl @Inject constructor(
    private val applicationDao: JobApplicationDao,
    private val jobDao: JobDao
) : ApplicationRepository {

    override fun getWorkerApplications(workerId: String): Flow<List<JobApplication>> {
        return applicationDao.getApplicationsForWorker(workerId).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun getJobApplicants(jobId: String): Flow<List<JobApplication>> {
        return applicationDao.getApplicationsForJob(jobId).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun getEmployerAllApplications(employerId: String): Flow<List<JobApplication>> {
        return applicationDao.getApplicationsForEmployer(employerId).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun applyForJob(workerId: String, jobId: String): Resource<JobApplication> {
        val job = jobDao.getJobByIdDirect(jobId) ?: return Resource.Error("فرصت شغلی مورد نظر یافت نشد")

        val applicationEntity = JobApplicationEntity(
            id = "app_${UUID.randomUUID().toString().take(8)}",
            jobId = jobId,
            jobTitle = job.title,
            workerId = workerId,
            workerName = "محمد حسینی",
            workerAvatarUrl = null,
            workerRating = 4.8f,
            workerSkills = listOf("برق‌کاری صنعتی و ساختمان", "تاسیسات"),
            workerExperienceYears = 6,
            employerId = job.employerId,
            businessName = job.businessName,
            salaryToman = job.salaryToman,
            jobDate = job.date,
            status = ApplicationStatus.PENDING,
            appliedAt = System.currentTimeMillis(),
            rejectionReason = null
        )

        applicationDao.insertApplication(applicationEntity)
        jobDao.updateApplicationStatus(jobId, true)

        return Resource.Success(applicationEntity.toDomain())
    }

    override suspend fun cancelApplication(applicationId: String): Resource<Boolean> {
        applicationDao.deleteApplication(applicationId)
        return Resource.Success(true)
    }

    override suspend fun updateApplicationStatus(applicationId: String, status: ApplicationStatus): Resource<Boolean> {
        applicationDao.updateApplicationStatus(applicationId, status)
        return Resource.Success(true)
    }
}

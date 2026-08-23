package com.karvin.app.data.repository

import com.karvin.app.data.local.KarvinDatabase
import com.karvin.app.data.local.entity.ShiftEntity
import com.karvin.app.data.mapper.toDomain
import com.karvin.app.data.mapper.toEntity
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.model.Rating
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.domain.repository.EmployerRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EmployerRepositoryImpl @Inject constructor(
    private val database: KarvinDatabase
) : EmployerRepository {

    override fun getEmployerProfile(userId: String): Flow<EmployerProfile?> {
        return database.userDao().getEmployerProfile(userId).map { it?.toDomain() }
    }

    override suspend fun updateEmployerProfile(profile: EmployerProfile): Resource<EmployerProfile> {
        database.userDao().insertEmployerProfile(profile.toEntity())
        return Resource.Success(profile)
    }

    override suspend fun createJobPost(job: Job): Resource<Job> {
        delay(700)
        database.jobDao().insertJob(job.toEntity())
        return Resource.Success(job)
    }

    override fun getEmployerJobs(employerId: String): Flow<List<Job>> {
        return database.jobDao().getEmployerJobs(employerId).map { list ->
            list.map { it.toDomain() }
        }
    }

    override fun getJobApplicants(employerId: String, jobId: String?): Flow<List<JobApplication>> {
        return database.applicationDao().getEmployerApplications(employerId, jobId).map { list ->
            list.map { it.toDomain() }
        }
    }

    override suspend fun updateApplicationStatus(applicationId: String, status: ApplicationStatus): Resource<JobApplication> {
        delay(400)
        database.applicationDao().updateStatus(applicationId, status)
        val application = database.applicationDao().getApplicationById(applicationId) ?: return Resource.Error("درخواست یافت نشد")

        if (status == ApplicationStatus.ACCEPTED) {
            // Automatically schedule a shift
            val shift = ShiftEntity(
                id = "shift_${UUID.randomUUID().toString().take(8)}",
                jobId = application.jobId,
                jobTitle = application.jobTitle,
                workerId = application.workerId,
                workerName = application.workerName,
                employerId = application.employerId,
                employerName = "مهندس علیرضا رضایی",
                businessName = application.businessName,
                date = application.jobDate,
                startTime = "۰۸:۳۰",
                endTime = "۱۷:۰۰",
                location = "تهران، دفتر پروژه",
                salaryToman = application.salaryToman,
                status = ShiftStatus.UPCOMING,
                checkInTime = null,
                checkOutTime = null
            )
            database.shiftDao().insertShift(shift)
        }

        return Resource.Success(application.toDomain())
    }

    override suspend fun rateWorker(rating: Rating): Resource<Rating> {
        delay(500)
        database.ratingDao().insertRating(rating.toEntity())
        return Resource.Success(rating)
    }

    override fun getEmployerShifts(employerId: String): Flow<List<Shift>> {
        return database.shiftDao().getEmployerShifts(employerId).map { list ->
            list.map { it.toDomain() }
        }
    }
}

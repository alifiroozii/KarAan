package com.karvin.app.data.repository

import com.karvin.app.data.local.KarvinDatabase
import com.karvin.app.data.mapper.toDomain
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.repository.JobRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class JobRepositoryImpl @Inject constructor(
    private val database: KarvinDatabase
) : JobRepository {

    override fun getNearbyJobs(city: String?, categoryId: String?, query: String?): Flow<List<Job>> {
        val effectiveCity = if (city.isNullOrBlank() || city == "همه") null else city
        val effectiveCategory = if (categoryId.isNullOrBlank() || categoryId == "all") null else categoryId
        val effectiveQuery = if (query.isNullOrBlank()) null else query.trim()

        return database.jobDao().searchJobs(effectiveCity, effectiveCategory, effectiveQuery).map { list ->
            list.map { it.toDomain() }
        }
    }

    override fun getUrgentJobs(): Flow<List<Job>> {
        return database.jobDao().getUrgentJobs().map { list ->
            list.map { it.toDomain() }
        }
    }

    override fun getJobById(jobId: String): Flow<Job?> {
        return database.jobDao().getJobById(jobId).map { it?.toDomain() }
    }

    override suspend fun refreshJobs(): Resource<Boolean> {
        // Seed if empty
        val existing = database.jobDao().getAllJobs()
        return Resource.Success(true)
    }
}

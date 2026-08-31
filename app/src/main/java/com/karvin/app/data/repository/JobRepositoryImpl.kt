package com.karvin.app.data.repository

import com.karvin.app.data.local.KarvinDatabase
import com.karvin.app.data.mapper.toDomain
import com.karvin.app.data.mapper.toEntity
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
            if (list.isEmpty()) {
                val fake = FakeDataGenerator.generate100Jobs()
                // Seed asynchronously into Room
                try {
                    database.jobDao().insertJobs(fake.map { it.toEntity() })
                } catch (t: Throwable) {
                    // Ignore
                }
                var filtered = fake
                if (!effectiveCity.isNullOrBlank()) {
                    filtered = filtered.filter { it.city == effectiveCity }
                }
                if (!effectiveCategory.isNullOrBlank()) {
                    filtered = filtered.filter { it.categoryId == effectiveCategory }
                }
                if (!effectiveQuery.isNullOrBlank()) {
                    val q = effectiveQuery.lowercase()
                    filtered = filtered.filter { it.title.lowercase().contains(q) || it.description.lowercase().contains(q) }
                }
                filtered
            } else {
                list.map { it.toDomain() }
            }
        }
    }

    override fun getUrgentJobs(): Flow<List<Job>> {
        return database.jobDao().getUrgentJobs().map { list ->
            if (list.isEmpty()) {
                FakeDataGenerator.generate100Jobs().filter { it.isUrgent }
            } else {
                list.map { it.toDomain() }
            }
        }
    }

    override fun getJobById(jobId: String): Flow<Job?> {
        return database.jobDao().getJobById(jobId).map { entity ->
            entity?.toDomain() ?: FakeDataGenerator.generate100Jobs().find { it.id == jobId }
        }
    }

    override suspend fun refreshJobs(): Resource<Boolean> {
        val fake = FakeDataGenerator.generate100Jobs()
        database.jobDao().insertJobs(fake.map { it.toEntity() })
        return Resource.Success(true)
    }
}

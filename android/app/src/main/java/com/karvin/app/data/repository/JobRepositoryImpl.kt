package com.karvin.app.data.repository

import com.karvin.app.core.common.ApiResult
import com.karvin.app.data.remote.JobApi
import com.karvin.app.domain.model.CreateJobRequest
import com.karvin.app.domain.model.JobRequest
import com.karvin.app.domain.repository.RemoteJobRepository
import javax.inject.Inject

class JobRepositoryImpl @Inject constructor(
    private val api: JobApi,
) : RemoteJobRepository {
    override suspend fun getNearbyJobs(latitude: Double, longitude: Double, radiusKm: Double?): ApiResult<List<JobRequest>> =
        execute { api.getNearbyJobs(latitude, longitude, radiusKm) }

    override suspend fun getMyJobs(): ApiResult<List<JobRequest>> = execute { api.getMyJobs() }

    override suspend fun createJob(request: CreateJobRequest): ApiResult<JobRequest> = execute { api.createJob(request) }

    private suspend fun <T> execute(block: suspend () -> T): ApiResult<T> = runCatching {
        ApiResult.Success(block())
    }.getOrElse { ApiResult.Error(it.message ?: "خطا در ارتباط با سرور", it) }
}

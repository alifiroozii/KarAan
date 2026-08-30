package com.karvin.app.data.remote

import com.karvin.app.domain.model.CreateJobRequest
import com.karvin.app.domain.model.JobRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface JobApi {
    @GET("jobs/nearby")
    suspend fun getNearbyJobs(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radiusKm") radiusKm: Double? = null,
    ): List<JobRequest>

    @GET("jobs/mine")
    suspend fun getMyJobs(): List<JobRequest>

    @POST("jobs")
    suspend fun createJob(@Body request: CreateJobRequest): JobRequest
}

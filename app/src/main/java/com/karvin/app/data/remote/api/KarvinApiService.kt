package com.karvin.app.data.remote.api

import com.karvin.app.data.remote.dto.ApplicationDto
import com.karvin.app.data.remote.dto.AuthResponse
import com.karvin.app.data.remote.dto.CreateJobRequest
import com.karvin.app.data.remote.dto.EmployerRegistrationDto
import com.karvin.app.data.remote.dto.JobDto
import com.karvin.app.data.remote.dto.SendOtpRequest
import com.karvin.app.data.remote.dto.SendOtpResponse
import com.karvin.app.data.remote.dto.VerifyOtpRequest
import com.karvin.app.data.remote.dto.WorkerRegistrationDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface AuthApiService {
    @POST("api/v1/auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): Response<SendOtpResponse>

    @POST("api/v1/auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): Response<AuthResponse>

    @POST("api/v1/worker/register")
    suspend fun registerWorker(@Body request: WorkerRegistrationDto): Response<AuthResponse>

    @POST("api/v1/employer/register")
    suspend fun registerEmployer(@Body request: EmployerRegistrationDto): Response<AuthResponse>
}

interface KarvinApiService {
    @GET("api/v1/jobs")
    suspend fun getJobs(
        @Query("city") city: String? = null,
        @Query("category_id") categoryId: String? = null,
        @Query("query") query: String? = null
    ): Response<List<JobDto>>

    @GET("api/v1/jobs/{id}")
    suspend fun getJobById(@Path("id") id: String): Response<JobDto>

    @POST("api/v1/jobs")
    suspend fun createJob(@Body request: CreateJobRequest): Response<JobDto>

    @POST("api/v1/jobs/{id}/apply")
    suspend fun applyForJob(@Path("id") jobId: String): Response<ApplicationDto>

    @GET("api/v1/worker/applications")
    suspend fun getWorkerApplications(): Response<List<ApplicationDto>>
}

package com.karvin.app.data.remote

import com.karvin.app.domain.model.CreateJobRequest
import com.karvin.app.domain.model.JobRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

data class ShiftActionResponse(
    val success: Boolean = true,
    val message: String? = null,
    val status: String? = null,
)

data class ShiftCheckInRequest(
    val latitude: Double,
    val longitude: Double,
)

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

    @POST("offers/{offerId}/accept")
    suspend fun acceptOffer(@Path("offerId") offerId: String): ShiftActionResponse

    @POST("offers/{offerId}/reject")
    suspend fun rejectOffer(@Path("offerId") offerId: String): ShiftActionResponse

    @POST("shifts/{shiftId}/reconfirm")
    suspend fun reconfirmShift(@Path("shiftId") shiftId: String): ShiftActionResponse

    @POST("shifts/{shiftId}/en-route")
    suspend fun setEnRoute(@Path("shiftId") shiftId: String): ShiftActionResponse

    @POST("shifts/{shiftId}/arrived")
    suspend fun setArrived(@Path("shiftId") shiftId: String): ShiftActionResponse

    @POST("shifts/{shiftId}/check-in")
    suspend fun checkIn(
        @Path("shiftId") shiftId: String,
        @Body request: ShiftCheckInRequest,
    ): ShiftActionResponse

    @POST("shifts/{shiftId}/check-out")
    suspend fun checkOut(
        @Path("shiftId") shiftId: String,
        @Body request: ShiftCheckInRequest,
    ): ShiftActionResponse
}

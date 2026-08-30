package com.karvin.app.data.remote

import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface AuthApi {
    @POST("auth/otp/send")
    suspend fun sendOtp(
        @Body request: SendOtpRequest,
        @Header("No-Auth") noAuth: String = "true",
    ): Unit

    @POST("auth/otp/verify")
    suspend fun verifyOtp(
        @Body request: VerifyOtpRequest,
        @Header("No-Auth") noAuth: String = "true",
    ): LoginResponse
}

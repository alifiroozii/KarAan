package com.karvin.app.data.remote

import com.karvin.app.domain.model.CreateJobRequest
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.PaymentRequest
import com.karvin.app.domain.model.PaymentStart
import com.karvin.app.domain.model.RatingRequest
import com.karvin.app.domain.model.Wallet
import com.karvin.app.domain.model.WalletTransaction
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface PaymentApi {
    @GET("wallet") suspend fun wallet(): Wallet
    @GET("wallet/transactions") suspend fun transactions(): List<WalletTransaction>
    @POST("wallet/deposit") suspend fun deposit(@Body request: PaymentRequest): PaymentStart
    @POST("wallet/withdraw") suspend fun withdraw(@Body request: PaymentRequest): Wallet
    @POST("payments/verify/{paymentId}") suspend fun verify(@Path("paymentId") paymentId: String): Wallet
    @POST("jobs/{jobId}/complete") suspend fun completeJob(@Path("jobId") jobId: String): Job
    @POST("jobs/{jobId}/reviews") suspend fun submitReview(@Path("jobId") jobId: String, @Body request: RatingRequest): Unit
}

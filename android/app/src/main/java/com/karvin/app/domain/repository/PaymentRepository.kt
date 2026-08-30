package com.karvin.app.domain.repository

import com.karvin.app.core.common.ApiResult
import com.karvin.app.domain.model.*

interface PaymentRepository {
    suspend fun wallet(): ApiResult<Wallet>
    suspend fun transactions(): ApiResult<List<WalletTransaction>>
    suspend fun startDeposit(amount: Long): ApiResult<PaymentStart>
    suspend fun withdraw(amount: Long): ApiResult<Wallet>
    suspend fun verifyPayment(paymentId: String): ApiResult<Wallet>
    suspend fun completeJob(jobId: String): ApiResult<Job>
    suspend fun submitReview(request: RatingRequest): ApiResult<Unit>
}

package com.karvin.app.data.repository

import com.karvin.app.core.common.ApiResult
import com.karvin.app.data.remote.PaymentApi
import com.karvin.app.domain.model.*
import com.karvin.app.domain.repository.PaymentRepository
import javax.inject.Inject

class PaymentRepositoryImpl @Inject constructor(private val api: PaymentApi) : PaymentRepository {
    override suspend fun wallet() = call { api.wallet() }
    override suspend fun transactions() = call { api.transactions() }
    override suspend fun startDeposit(amount: Long) = call { api.deposit(PaymentRequest(amount)) }
    override suspend fun withdraw(amount: Long) = call { api.withdraw(PaymentRequest(amount)) }
    override suspend fun verifyPayment(paymentId: String) = call { api.verify(paymentId) }
    override suspend fun completeJob(jobId: String) = call { api.completeJob(jobId) }
    override suspend fun submitReview(request: RatingRequest) = call { api.submitReview(request.jobId, request) }
    private suspend fun <T> call(block: suspend () -> T): ApiResult<T> = runCatching { ApiResult.Success(block()) }.getOrElse { ApiResult.Error(it.message ?: "عملیات پرداخت ناموفق بود", it) }
}

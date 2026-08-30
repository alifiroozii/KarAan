package com.karvin.app.data.repository

import android.util.Log
import com.karvin.app.core.common.ApiResult
import com.karvin.app.data.remote.AuthApi
import com.karvin.app.data.remote.SendOtpRequest
import com.karvin.app.data.remote.VerifyOtpRequest
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.repository.PhoneAuthRepository
import com.karvin.app.domain.repository.PhoneAuthSession
import javax.inject.Inject

class MockAuthRepositoryImpl @Inject constructor(
    private val api: AuthApi,
) : PhoneAuthRepository {
    val isDevMode = true
    private val mockCode = "12345"

    override suspend fun sendOtp(phone: String): ApiResult<Unit> = runCatching {
        if (isDevMode) {
            Log.d(TAG, "[DEV MODE] OTP for $phone: $mockCode")
            Unit
        } else {
            api.sendOtp(SendOtpRequest(phone))
        }
        ApiResult.Success(Unit)
    }.getOrElse { ApiResult.Error(it.message ?: "ارسال کد ناموفق بود", it) }

    override suspend fun verifyOtp(phone: String, code: String): ApiResult<PhoneAuthSession> = runCatching {
        if (isDevMode) {
            check(code == mockCode) { "کد تایید صحیح نیست." }
            PhoneAuthSession(token = "dev-token-$phone", role = UserRole.REQUESTER)
        } else {
            val response = api.verifyOtp(VerifyOtpRequest(phone, code))
            PhoneAuthSession(response.token, response.role.toRole())
        }.let { session -> ApiResult.Success(session) }
    }.getOrElse { ApiResult.Error(it.message ?: "کد تایید نامعتبر است", it) }

    private fun String.toRole() = if (equals("PROVIDER", true) || equals("WORKER", true)) UserRole.PROVIDER else UserRole.REQUESTER
    private companion object { const val TAG = "KarvinAuth" }
}

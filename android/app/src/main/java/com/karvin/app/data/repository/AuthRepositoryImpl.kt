package com.karvin.app.data.repository

import com.karvin.app.core.common.ApiResult
import com.karvin.app.data.remote.AuthApi
import com.karvin.app.data.remote.LoginResponse
import com.karvin.app.data.remote.SendOtpRequest
import com.karvin.app.data.remote.VerifyOtpRequest
import com.karvin.app.domain.repository.NetworkAuthRepository
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val api: AuthApi,
) : NetworkAuthRepository {
    override suspend fun sendOtp(phone: String): ApiResult<Unit> = runCatching {
        api.sendOtp(SendOtpRequest(phone))
        ApiResult.Success(Unit)
    }.getOrElse { error -> ApiResult.Error(error.message ?: "ارسال کد با خطا مواجه شد", error) }

    override suspend fun verifyOtp(phone: String, code: String): ApiResult<LoginResponse> = runCatching {
        ApiResult.Success(api.verifyOtp(VerifyOtpRequest(phone, code)))
    }.getOrElse { error -> ApiResult.Error(error.message ?: "کد واردشده معتبر نیست", error) }
}

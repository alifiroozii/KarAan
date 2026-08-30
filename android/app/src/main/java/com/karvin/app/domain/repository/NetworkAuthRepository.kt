package com.karvin.app.domain.repository

import com.karvin.app.core.common.ApiResult
import com.karvin.app.data.remote.LoginResponse
import kotlinx.coroutines.flow.Flow

interface NetworkAuthRepository {
    suspend fun sendOtp(phone: String): ApiResult<Unit>
    suspend fun verifyOtp(phone: String, code: String): ApiResult<LoginResponse>
}

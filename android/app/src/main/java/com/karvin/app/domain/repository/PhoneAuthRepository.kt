package com.karvin.app.domain.repository

import com.karvin.app.core.common.ApiResult
import com.karvin.app.domain.model.UserRole

interface PhoneAuthRepository {
    suspend fun sendOtp(phone: String): ApiResult<Unit>
    suspend fun verifyOtp(phone: String, code: String): ApiResult<PhoneAuthSession>
}

data class PhoneAuthSession(val token: String, val role: UserRole)

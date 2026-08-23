package com.karvin.app.domain.usecase.auth

import com.karvin.app.domain.repository.AuthRepository
import com.karvin.app.utils.Resource
import javax.inject.Inject

class SendOtpUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(phoneNumber: String): Resource<Boolean> {
        if (phoneNumber.length < 10 || !phoneNumber.startsWith("09")) {
            return Resource.Error("لطفاً یک شماره همراه معتبر ۱۱ رقمی (مثلاً ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید")
        }
        return authRepository.sendOtp(phoneNumber)
    }
}

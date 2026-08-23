package com.karvin.app.domain.usecase.auth

import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.repository.AuthRepository
import com.karvin.app.utils.Resource
import javax.inject.Inject

class LoginWithOtpUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(phoneNumber: String, code: String, role: UserRole): Resource<User> {
        if (code.length != 5) {
            return Resource.Error("کد تایید باید ۵ رقم باشد")
        }
        return authRepository.verifyOtp(phoneNumber, code, role)
    }
}

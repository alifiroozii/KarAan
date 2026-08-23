package com.karvin.app.domain.usecase.auth

import com.karvin.app.domain.repository.AuthRepository
import com.karvin.app.utils.Resource
import javax.inject.Inject

class LogoutUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): Resource<Boolean> {
        return authRepository.logout()
    }
}

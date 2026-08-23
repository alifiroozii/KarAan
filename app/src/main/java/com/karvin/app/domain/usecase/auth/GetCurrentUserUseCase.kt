package com.karvin.app.domain.usecase.auth

import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetCurrentUserUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator fun invoke(): Flow<User?> = authRepository.getCurrentUser()
    fun getAuthRole(): Flow<UserRole> = authRepository.getAuthRole()
}

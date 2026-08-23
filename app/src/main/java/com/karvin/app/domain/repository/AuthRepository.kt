package com.karvin.app.domain.repository

import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    fun getCurrentUser(): Flow<User?>
    fun getAuthRole(): Flow<UserRole>
    suspend fun sendOtp(phoneNumber: String): Resource<Boolean>
    suspend fun verifyOtp(phoneNumber: String, code: String, role: UserRole): Resource<User>
    suspend fun registerWorker(profile: WorkerProfile): Resource<User>
    suspend fun registerEmployer(profile: EmployerProfile): Resource<User>
    suspend fun logout(): Resource<Boolean>
    suspend fun setAuthRole(role: UserRole)
}

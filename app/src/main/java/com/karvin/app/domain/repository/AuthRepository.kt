package com.karvin.app.domain.repository

import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun sendOtp(phoneNumber: String): Resource<Boolean>
    suspend fun loginWithOtp(phoneNumber: String, code: String, role: UserRole): Resource<User>
    suspend fun registerWorker(workerProfile: WorkerProfile, phoneNumber: String): Resource<User>
    suspend fun registerEmployer(employerProfile: EmployerProfile, phoneNumber: String): Resource<User>
    suspend fun switchRole(targetRole: UserRole): Resource<UserRole>
    fun getCurrentUser(): Flow<User?>
    suspend fun logout(): Resource<Boolean>
}

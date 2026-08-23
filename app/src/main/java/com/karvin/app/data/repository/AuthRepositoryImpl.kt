package com.karvin.app.data.repository

import com.karvin.app.data.local.dao.UserDao
import com.karvin.app.data.mapper.toDomain
import com.karvin.app.data.mapper.toEntity
import com.karvin.app.data.security.SessionManager
import com.karvin.app.data.security.UserRoleManager
import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.AuthRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val userDao: UserDao,
    private val sessionManager: SessionManager,
    private val userRoleManager: UserRoleManager
) : AuthRepository {

    override suspend fun sendOtp(phoneNumber: String): Resource<Boolean> {
        delay(600) // Simulate network delay
        if (phoneNumber.length != 11 || !phoneNumber.startsWith("09")) {
            return Resource.Error("لطفاً شماره تلفن معتبر ۱۱ رقمی وارد کنید")
        }
        return Resource.Success(true)
    }

    override suspend fun loginWithOtp(phoneNumber: String, code: String, role: UserRole): Resource<User> {
        delay(800)
        if (code.length != 5) {
            return Resource.Error("کد تایید باید ۵ رقم باشد")
        }

        // Demo login accepted for any 5-digit code (e.g., 12345)
        var userEntity = userDao.getUserByPhone(phoneNumber)
        if (userEntity == null) {
            val userId = if (role == UserRole.WORKER) "worker_default" else "emp_101"
            val newUser = User(
                id = userId,
                phoneNumber = phoneNumber,
                role = role,
                isRegistered = true
            )
            userDao.insertUser(newUser.toEntity())
            userEntity = userDao.getUserByPhone(phoneNumber)
        }

        val user = userEntity?.toDomain() ?: User(
            id = UUID.randomUUID().toString(),
            phoneNumber = phoneNumber,
            role = role,
            isRegistered = true
        )

        sessionManager.saveSession(user, "jwt_mock_token_${System.currentTimeMillis()}")
        return Resource.Success(user)
    }

    override suspend fun registerWorker(workerProfile: WorkerProfile, phoneNumber: String): Resource<User> {
        delay(1000)
        val user = User(
            id = workerProfile.userId,
            phoneNumber = phoneNumber,
            role = UserRole.WORKER,
            isRegistered = true
        )
        userDao.insertUser(user.toEntity())
        sessionManager.saveSession(user, "jwt_mock_token_${System.currentTimeMillis()}")
        return Resource.Success(user)
    }

    override suspend fun registerEmployer(employerProfile: EmployerProfile, phoneNumber: String): Resource<User> {
        delay(1000)
        val user = User(
            id = employerProfile.userId,
            phoneNumber = phoneNumber,
            role = UserRole.EMPLOYER,
            isRegistered = true
        )
        userDao.insertUser(user.toEntity())
        sessionManager.saveSession(user, "jwt_mock_token_${System.currentTimeMillis()}")
        return Resource.Success(user)
    }

    override suspend fun switchRole(targetRole: UserRole): Resource<UserRole> {
        return userRoleManager.switchRole(targetRole)
    }

    override fun getCurrentUser(): Flow<User?> {
        return userDao.getCurrentUser().map { it?.toDomain() }
    }

    override suspend fun logout(): Resource<Boolean> {
        sessionManager.clearSession()
        return Resource.Success(true)
    }
}

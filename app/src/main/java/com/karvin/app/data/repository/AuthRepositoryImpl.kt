package com.karvin.app.data.repository

import com.karvin.app.data.local.KarvinDatabase
import com.karvin.app.data.local.PreferencesManager
import com.karvin.app.data.local.entity.UserEntity
import com.karvin.app.data.mapper.toDomain
import com.karvin.app.data.mapper.toEntity
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
    private val database: KarvinDatabase,
    private val preferencesManager: PreferencesManager
) : AuthRepository {

    override fun getCurrentUser(): Flow<User?> {
        return database.userDao().getActiveUser().map { it?.toDomain() }
    }

    override fun getAuthRole(): Flow<UserRole> {
        return preferencesManager.userRoleFlow
    }

    override suspend fun setAuthRole(role: UserRole) {
        preferencesManager.setUserRole(role)
    }

    override suspend fun sendOtp(phoneNumber: String): Resource<Boolean> {
        // Simulate network latency
        delay(800)
        return Resource.Success(true)
    }

    override suspend fun verifyOtp(phoneNumber: String, code: String, role: UserRole): Resource<User> {
        delay(900)
        val userId = if (role == UserRole.WORKER) "worker_default" else "employer_default"
        val existingUser = database.userDao().getUserById(userId)

        val userEntity = if (existingUser != null) {
            existingUser
        } else {
            val newUser = UserEntity(
                id = userId,
                phoneNumber = phoneNumber,
                fullName = if (role == UserRole.WORKER) "محمد حسینی" else "مهندس علیرضا رضایی",
                role = role,
                isProfileCompleted = true,
                avatarUrl = null,
                token = "mock_jwt_token_${UUID.randomUUID()}",
                createdAt = System.currentTimeMillis()
            )
            database.userDao().insertUser(newUser)

            // Seed initial profile data and seed jobs/shifts if empty
            if (role == UserRole.WORKER) {
                database.userDao().insertWorkerProfile(FakeDataGenerator.createDefaultWorkerProfile(userId, phoneNumber))
            } else {
                database.userDao().insertEmployerProfile(FakeDataGenerator.createDefaultEmployerProfile(userId, phoneNumber))
            }

            database.jobDao().insertJobs(FakeDataGenerator.createInitialJobs())
            database.applicationDao().insertApplications(FakeDataGenerator.createInitialApplications())
            database.shiftDao().insertShifts(FakeDataGenerator.createInitialShifts())
            database.notificationDao().insertNotifications(FakeDataGenerator.createInitialNotifications())

            newUser
        }

        preferencesManager.saveAuthSession(userEntity.id, userEntity.phoneNumber, userEntity.role, userEntity.token)
        return Resource.Success(userEntity.toDomain())
    }

    override suspend fun registerWorker(profile: WorkerProfile): Resource<User> {
        delay(800)
        val userEntity = UserEntity(
            id = profile.userId,
            phoneNumber = "09123456789",
            fullName = profile.fullName,
            role = UserRole.WORKER,
            isProfileCompleted = true,
            avatarUrl = profile.avatarUrl,
            token = "mock_jwt_token_${UUID.randomUUID()}",
            createdAt = System.currentTimeMillis()
        )
        database.userDao().insertUser(userEntity)
        database.userDao().insertWorkerProfile(profile.toEntity())
        preferencesManager.saveAuthSession(userEntity.id, userEntity.phoneNumber, userEntity.role, userEntity.token)
        return Resource.Success(userEntity.toDomain())
    }

    override suspend fun registerEmployer(profile: EmployerProfile): Resource<User> {
        delay(800)
        val userEntity = UserEntity(
            id = profile.userId,
            phoneNumber = "09129876543",
            fullName = profile.fullName,
            role = UserRole.EMPLOYER,
            isProfileCompleted = true,
            avatarUrl = profile.avatarUrl,
            token = "mock_jwt_token_${UUID.randomUUID()}",
            createdAt = System.currentTimeMillis()
        )
        database.userDao().insertUser(userEntity)
        database.userDao().insertEmployerProfile(profile.toEntity())
        preferencesManager.saveAuthSession(userEntity.id, userEntity.phoneNumber, userEntity.role, userEntity.token)
        return Resource.Success(userEntity.toDomain())
    }

    override suspend fun logout(): Resource<Boolean> {
        delay(400)
        database.userDao().clearUsers()
        preferencesManager.clearSession()
        return Resource.Success(true)
    }
}

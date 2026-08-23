package com.karvin.app.data.security

import com.karvin.app.domain.model.UserRole
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRoleManager @Inject constructor(
    private val sessionManager: SessionManager
) {
    val activeRoleFlow: Flow<UserRole> = sessionManager.sessionFlow.map { it.activeRole }

    suspend fun switchRole(targetRole: UserRole): Resource<UserRole> {
        return try {
            sessionManager.switchActiveRole(targetRole)
            Resource.Success(targetRole)
        } catch (e: Exception) {
            Resource.Error("خطا در تغییر نقش کاربری: ${e.localizedMessage}")
        }
    }
}

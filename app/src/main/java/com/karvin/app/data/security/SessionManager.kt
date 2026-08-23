package com.karvin.app.data.security

import com.karvin.app.data.local.PreferencesManager
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import javax.inject.Inject
import javax.inject.Singleton

data class UserSession(
    val isLoggedIn: Boolean = false,
    val userId: String? = null,
    val phoneNumber: String? = null,
    val activeRole: UserRole = UserRole.WORKER,
    val authToken: String? = null,
    val isProfileComplete: Boolean = true
)

@Singleton
class SessionManager @Inject constructor(
    private val preferencesManager: PreferencesManager
) {
    val sessionFlow: Flow<UserSession> = combine(
        preferencesManager.isLoggedInFlow,
        preferencesManager.userIdFlow,
        preferencesManager.userRoleFlow,
        preferencesManager.authTokenFlow
    ) { isLoggedIn, userId, roleStr, token ->
        val role = try {
            if (roleStr != null) UserRole.valueOf(roleStr) else UserRole.WORKER
        } catch (e: Exception) {
            UserRole.WORKER
        }
        UserSession(
            isLoggedIn = isLoggedIn,
            userId = userId,
            activeRole = role,
            authToken = token,
            isProfileComplete = !userId.isNullOrBlank()
        )
    }

    suspend fun saveSession(user: User, token: String) {
        preferencesManager.saveAuthToken(token)
        preferencesManager.saveUserRole(user.role.name)
        preferencesManager.saveUserId(user.id)
        preferencesManager.setLoggedIn(true)
    }

    suspend fun switchActiveRole(newRole: UserRole) {
        preferencesManager.saveUserRole(newRole.name)
    }

    suspend fun clearSession() {
        preferencesManager.clearAuthData()
    }
}

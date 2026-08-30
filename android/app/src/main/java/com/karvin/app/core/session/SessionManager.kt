package com.karvin.app.core.session

import com.karvin.app.domain.model.UserRole
import kotlinx.coroutines.flow.StateFlow

interface SessionManager {
    val state: StateFlow<SessionState>

    suspend fun setSession(token: String, role: UserRole)
    suspend fun setRole(role: UserRole)
    suspend fun clearSession()
}

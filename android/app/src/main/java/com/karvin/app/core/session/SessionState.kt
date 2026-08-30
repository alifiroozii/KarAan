package com.karvin.app.core.session

import com.karvin.app.domain.model.UserRole

data class SessionState(
    val isLoading: Boolean = true,
    val isLoggedIn: Boolean = false,
    val token: String? = null,
    val role: UserRole? = null,
)

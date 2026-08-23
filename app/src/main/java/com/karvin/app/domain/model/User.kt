package com.karvin.app.domain.model

enum class UserRole {
    WORKER,
    EMPLOYER,
    NONE
}

data class User(
    val id: String,
    val phoneNumber: String,
    val fullName: String,
    val role: UserRole,
    val isProfileCompleted: Boolean = false,
    val avatarUrl: String? = null,
    val token: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

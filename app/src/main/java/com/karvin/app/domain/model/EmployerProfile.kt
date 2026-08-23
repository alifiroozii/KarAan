package com.karvin.app.domain.model

data class EmployerProfile(
    val userId: String,
    val fullName: String,
    val businessName: String,
    val businessCategory: String,
    val city: String,
    val address: String,
    val contactInfo: String,
    val avatarUrl: String? = null,
    val isVerified: Boolean = true,
    val rating: Float = 5.0f,
    val postedJobsCount: Int = 0,
    val activeShiftsCount: Int = 0
)

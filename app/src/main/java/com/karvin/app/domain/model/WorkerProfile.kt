package com.karvin.app.domain.model

enum class Gender {
    MALE,
    FEMALE,
    OTHER
}

data class WorkerProfile(
    val userId: String,
    val fullName: String,
    val nationalId: String,
    val birthDate: String,
    val gender: Gender,
    val avatarUrl: String? = null,
    val skills: List<Skill> = emptyList(),
    val categories: List<JobCategory> = emptyList(),
    val experienceYears: Int = 0,
    val city: String = "",
    val address: String = "",
    val availableDays: List<String> = emptyList(),
    val availableHours: String = "",
    val preferredJobs: List<String> = emptyList(),
    val rating: Float = 5.0f,
    val completedJobsCount: Int = 0,
    val isAvailableForWork: Boolean = true,
    val totalEarningsToman: Long = 0
)

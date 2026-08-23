package com.karvin.app.domain.model

enum class JobStatus {
    OPEN,
    IN_PROGRESS,
    FILLED,
    CANCELLED,
    COMPLETED
}

data class Job(
    val id: String,
    val employerId: String,
    val employerName: String,
    val businessName: String,
    val title: String,
    val description: String,
    val categoryId: String,
    val categoryName: String,
    val numberOfWorkersNeeded: Int,
    val currentWorkersCount: Int = 0,
    val date: String,
    val startTime: String,
    val endTime: String,
    val salaryToman: Long,
    val isHourlySalary: Boolean = false,
    val city: String,
    val address: String,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val requiredSkills: List<String> = emptyList(),
    val status: JobStatus = JobStatus.OPEN,
    val createdAt: Long = System.currentTimeMillis(),
    val isUrgent: Boolean = false,
    val hasApplied: Boolean = false
)

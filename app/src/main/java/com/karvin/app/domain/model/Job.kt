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
    val employerRating: Float = 4.8f,
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
    val latitude: Double? = 35.7219,
    val longitude: Double? = 51.3347,
    val distanceMeters: Int? = null,
    val distanceTextFa: String? = null,
    val matchScorePercentage: Int? = null,
    val requiredSkills: List<String> = emptyList(),
    val status: JobStatus = JobStatus.OPEN,
    val createdAt: Long = System.currentTimeMillis(),
    val isUrgent: Boolean = false,
    val hasApplied: Boolean = false,
    val isFavorite: Boolean = false
)

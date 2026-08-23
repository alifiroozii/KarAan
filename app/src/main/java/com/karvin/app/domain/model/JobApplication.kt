package com.karvin.app.domain.model

enum class ApplicationStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    CANCELLED,
    COMPLETED
}

data class JobApplication(
    val id: String,
    val jobId: String,
    val jobTitle: String,
    val workerId: String,
    val workerName: String,
    val workerAvatarUrl: String? = null,
    val workerRating: Float = 5.0f,
    val workerSkills: List<String> = emptyList(),
    val workerExperienceYears: Int = 0,
    val employerId: String,
    val businessName: String,
    val salaryToman: Long,
    val jobDate: String,
    val status: ApplicationStatus = ApplicationStatus.PENDING,
    val appliedAt: Long = System.currentTimeMillis(),
    val rejectionReason: String? = null
)

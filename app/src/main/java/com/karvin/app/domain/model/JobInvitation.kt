package com.karvin.app.domain.model

enum class WorkerAvailabilityStatus(val titleFa: String, val dotColorHex: Long) {
    AVAILABLE("آماده کار", 0xFF059669),
    BUSY("مشغول کار", 0xFFE11D48),
    OFFLINE("آفلاین", 0xFF9CA3AF)
}

enum class InvitationStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    EXPIRED
}

data class JobInvitation(
    val id: String,
    val employerId: String,
    val employerName: String,
    val businessName: String,
    val employerRating: Float = 5.0f,
    val workerId: String,
    val workerName: String,
    val jobId: String,
    val jobTitle: String,
    val jobSalaryToman: Long,
    val jobDate: String,
    val jobTime: String,
    val location: String,
    val status: InvitationStatus = InvitationStatus.PENDING,
    val sentAt: Long = System.currentTimeMillis(),
    val message: String? = null
)

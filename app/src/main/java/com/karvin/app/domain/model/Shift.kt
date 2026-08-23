package com.karvin.app.domain.model

enum class ShiftStatus {
    UPCOMING,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}

data class Shift(
    val id: String,
    val jobId: String,
    val jobTitle: String,
    val workerId: String,
    val workerName: String,
    val employerId: String,
    val employerName: String,
    val businessName: String,
    val date: String,
    val startTime: String,
    val endTime: String,
    val location: String,
    val salaryToman: Long,
    val status: ShiftStatus = ShiftStatus.UPCOMING,
    val checkInTime: String? = null,
    val checkOutTime: String? = null
)

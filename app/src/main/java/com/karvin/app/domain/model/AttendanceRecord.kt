package com.karvin.app.domain.model

enum class AttendanceVerificationMethod {
    GPS_GEOFENCE,
    QR_CODE,
    EMPLOYER_MANUAL
}

data class AttendanceRecord(
    val id: String,
    val shiftId: String,
    val workerId: String,
    val workerName: String,
    val employerId: String,
    val jobTitle: String,
    val checkInTimestamp: Long?,
    val checkInLatitude: Double?,
    val checkInLongitude: Double?,
    val checkOutTimestamp: Long?,
    val checkOutLatitude: Double?,
    val checkOutLongitude: Double?,
    val isLocationVerified: Boolean = true,
    val distanceToWorkplaceMeters: Int = 35,
    val verificationMethod: AttendanceVerificationMethod = AttendanceVerificationMethod.GPS_GEOFENCE,
    val isConfirmedByEmployer: Boolean = true,
    val totalHoursWorked: Float = 8.0f
)

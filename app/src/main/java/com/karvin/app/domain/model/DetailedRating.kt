package com.karvin.app.domain.model

data class WorkerRatingSubmission(
    val id: String,
    val shiftId: String,
    val workerId: String,
    val employerId: String,
    val qualityScore: Float = 5.0f,
    val attendanceScore: Float = 5.0f,
    val skillScore: Float = 5.0f,
    val behaviorScore: Float = 5.0f,
    val comment: String = "",
    val timestamp: Long = System.currentTimeMillis()
) {
    val overallRating: Float
        get() = (qualityScore + attendanceScore + skillScore + behaviorScore) / 4.0f
}

data class EmployerRatingSubmission(
    val id: String,
    val shiftId: String,
    val employerId: String,
    val workerId: String,
    val paymentReliabilityScore: Float = 5.0f,
    val communicationScore: Float = 5.0f,
    val workEnvironmentScore: Float = 5.0f,
    val comment: String = "",
    val timestamp: Long = System.currentTimeMillis()
) {
    val overallRating: Float
        get() = (paymentReliabilityScore + communicationScore + workEnvironmentScore) / 3.0f
}

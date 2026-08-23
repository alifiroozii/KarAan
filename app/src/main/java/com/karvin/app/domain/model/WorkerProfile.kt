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
    val primarySkill: String = "استادکار فنی",
    val experienceYears: Int = 0,
    val city: String = "تهران",
    val address: String = "",
    val latitude: Double? = 35.7219,
    val longitude: Double? = 51.3347,
    val distanceMeters: Int? = null,
    val distanceTextFa: String? = null,
    val matchScorePercentage: Int? = null,
    val availableDays: List<String> = emptyList(),
    val availableHours: String = "",
    val preferredJobs: List<String> = emptyList(),
    val rating: Float = 5.0f,
    val attendanceScorePercentage: Int = 98,
    val completedJobsCount: Int = 0,
    val isAvailableForWork: Boolean = true,
    val isAvailableNow: Boolean = true,
    val availabilityStatus: WorkerAvailabilityStatus = WorkerAvailabilityStatus.AVAILABLE,
    val trustBadges: List<TrustBadge> = emptyList(),
    val totalEarningsToman: Long = 0,
    val bio: String = "استادکار متخصص و با انگیزه در پلتفرم کاروین"
)

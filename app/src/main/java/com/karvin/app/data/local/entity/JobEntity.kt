package com.karvin.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.NotificationType
import com.karvin.app.domain.model.ShiftStatus

@Entity(tableName = "jobs")
data class JobEntity(
    @PrimaryKey
    val id: String,
    val employerId: String,
    val employerName: String,
    val businessName: String,
    val title: String,
    val description: String,
    val categoryId: String,
    val categoryName: String,
    val numberOfWorkersNeeded: Int,
    val currentWorkersCount: Int,
    val date: String,
    val startTime: String,
    val endTime: String,
    val salaryToman: Long,
    val isHourlySalary: Boolean,
    val city: String,
    val address: String,
    val latitude: Double?,
    val longitude: Double?,
    val requiredSkills: List<String>,
    val status: JobStatus,
    val createdAt: Long,
    val isUrgent: Boolean,
    val hasApplied: Boolean
)

@Entity(tableName = "job_applications")
data class JobApplicationEntity(
    @PrimaryKey
    val id: String,
    val jobId: String,
    val jobTitle: String,
    val workerId: String,
    val workerName: String,
    val workerAvatarUrl: String?,
    val workerRating: Float,
    val workerSkills: List<String>,
    val workerExperienceYears: Int,
    val employerId: String,
    val businessName: String,
    val salaryToman: Long,
    val jobDate: String,
    val status: ApplicationStatus,
    val appliedAt: Long,
    val rejectionReason: String?
)

@Entity(tableName = "shifts")
data class ShiftEntity(
    @PrimaryKey
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
    val status: ShiftStatus,
    val checkInTime: String?,
    val checkOutTime: String?
)

@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey
    val id: String,
    val userId: String,
    val title: String,
    val message: String,
    val type: NotificationType,
    val timestamp: Long,
    val isRead: Boolean,
    val referenceId: String?
)

@Entity(tableName = "ratings")
data class RatingEntity(
    @PrimaryKey
    val id: String,
    val raterId: String,
    val raterName: String,
    val targetUserId: String,
    val jobId: String,
    val score: Float,
    val comment: String?,
    val createdAt: Long
)

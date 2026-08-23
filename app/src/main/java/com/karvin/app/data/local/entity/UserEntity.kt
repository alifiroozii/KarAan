package com.karvin.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.karvin.app.domain.model.Gender
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.model.Skill
import com.karvin.app.domain.model.UserRole

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    val id: String,
    val phoneNumber: String,
    val fullName: String,
    val role: UserRole,
    val isProfileCompleted: Boolean,
    val avatarUrl: String?,
    val token: String?,
    val createdAt: Long
)

@Entity(tableName = "worker_profiles")
data class WorkerProfileEntity(
    @PrimaryKey
    val userId: String,
    val fullName: String,
    val nationalId: String,
    val birthDate: String,
    val gender: Gender,
    val avatarUrl: String?,
    val skills: List<Skill>,
    val categories: List<JobCategory>,
    val experienceYears: Int,
    val city: String,
    val address: String,
    val availableDays: List<String>,
    val availableHours: String,
    val preferredJobs: List<String>,
    val rating: Float,
    val completedJobsCount: Int,
    val isAvailableForWork: Boolean,
    val totalEarningsToman: Long
)

@Entity(tableName = "employer_profiles")
data class EmployerProfileEntity(
    @PrimaryKey
    val userId: String,
    val fullName: String,
    val businessName: String,
    val businessCategory: String,
    val city: String,
    val address: String,
    val contactInfo: String,
    val avatarUrl: String?,
    val isVerified: Boolean,
    val rating: Float,
    val postedJobsCount: Int,
    val activeShiftsCount: Int
)

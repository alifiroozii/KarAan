package com.karvin.app.data.remote.dto

import com.google.gson.annotations.SerializedName

// Auth DTOs
data class SendOtpRequest(
    @SerializedName("phone_number") val phoneNumber: String
)

data class SendOtpResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String
)

data class VerifyOtpRequest(
    @SerializedName("phone_number") val phoneNumber: String,
    @SerializedName("code") val code: String,
    @SerializedName("role") val role: String
)

data class AuthResponse(
    @SerializedName("token") val token: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("phone_number") val phoneNumber: String,
    @SerializedName("role") val role: String,
    @SerializedName("is_profile_completed") val isProfileCompleted: Boolean
)

// Job DTOs
data class JobDto(
    @SerializedName("id") val id: String,
    @SerializedName("employer_id") val employerId: String,
    @SerializedName("employer_name") val employerName: String,
    @SerializedName("business_name") val businessName: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("category_id") val categoryId: String,
    @SerializedName("category_name") val categoryName: String,
    @SerializedName("workers_needed") val workersNeeded: Int,
    @SerializedName("current_workers") val currentWorkers: Int,
    @SerializedName("date") val date: String,
    @SerializedName("start_time") val startTime: String,
    @SerializedName("end_time") val endTime: String,
    @SerializedName("salary_toman") val salaryToman: Long,
    @SerializedName("is_hourly") val isHourly: Boolean,
    @SerializedName("city") val city: String,
    @SerializedName("address") val address: String,
    @SerializedName("required_skills") val requiredSkills: List<String>,
    @SerializedName("status") val status: String,
    @SerializedName("is_urgent") val isUrgent: Boolean
)

data class CreateJobRequest(
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("category_id") val categoryId: String,
    @SerializedName("workers_needed") val workersNeeded: Int,
    @SerializedName("date") val date: String,
    @SerializedName("start_time") val startTime: String,
    @SerializedName("end_time") val endTime: String,
    @SerializedName("salary_toman") val salaryToman: Long,
    @SerializedName("city") val city: String,
    @SerializedName("address") val address: String,
    @SerializedName("required_skills") val requiredSkills: List<String>
)

data class ApplicationDto(
    @SerializedName("id") val id: String,
    @SerializedName("job_id") val jobId: String,
    @SerializedName("worker_id") val workerId: String,
    @SerializedName("worker_name") val workerName: String,
    @SerializedName("status") val status: String,
    @SerializedName("applied_at") val appliedAt: Long
)

// Profile DTOs
data class WorkerRegistrationDto(
    @SerializedName("full_name") val fullName: String,
    @SerializedName("national_id") val nationalId: String,
    @SerializedName("birth_date") val birthDate: String,
    @SerializedName("gender") val gender: String,
    @SerializedName("skills") val skills: List<String>,
    @SerializedName("experience_years") val experienceYears: Int,
    @SerializedName("city") val city: String,
    @SerializedName("address") val address: String,
    @SerializedName("available_days") val availableDays: List<String>,
    @SerializedName("available_hours") val availableHours: String
)

data class EmployerRegistrationDto(
    @SerializedName("full_name") val fullName: String,
    @SerializedName("business_name") val businessName: String,
    @SerializedName("business_category") val businessCategory: String,
    @SerializedName("city") val city: String,
    @SerializedName("address") val address: String,
    @SerializedName("contact_info") val contactInfo: String
)

package com.karvin.app.data.mapper

import com.karvin.app.data.local.entity.EmployerProfileEntity
import com.karvin.app.data.local.entity.JobApplicationEntity
import com.karvin.app.data.local.entity.JobEntity
import com.karvin.app.data.local.entity.NotificationEntity
import com.karvin.app.data.local.entity.RatingEntity
import com.karvin.app.data.local.entity.ShiftEntity
import com.karvin.app.data.local.entity.UserEntity
import com.karvin.app.data.local.entity.WorkerProfileEntity
import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.model.NotificationItem
import com.karvin.app.domain.model.Rating
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.WorkerProfile

fun UserEntity.toDomain(): User = User(
    id = id,
    phoneNumber = phoneNumber,
    fullName = fullName,
    role = role,
    isProfileCompleted = isProfileCompleted,
    avatarUrl = avatarUrl,
    token = token,
    createdAt = createdAt
)

fun User.toEntity(): UserEntity = UserEntity(
    id = id,
    phoneNumber = phoneNumber,
    fullName = fullName,
    role = role,
    isProfileCompleted = isProfileCompleted,
    avatarUrl = avatarUrl,
    token = token,
    createdAt = createdAt
)

fun WorkerProfileEntity.toDomain(): WorkerProfile = WorkerProfile(
    userId = userId,
    fullName = fullName,
    nationalId = nationalId,
    birthDate = birthDate,
    gender = gender,
    avatarUrl = avatarUrl,
    skills = skills,
    categories = categories,
    experienceYears = experienceYears,
    city = city,
    address = address,
    availableDays = availableDays,
    availableHours = availableHours,
    preferredJobs = preferredJobs,
    rating = rating,
    completedJobsCount = completedJobsCount,
    isAvailableForWork = isAvailableForWork,
    totalEarningsToman = totalEarningsToman
)

fun WorkerProfile.toEntity(): WorkerProfileEntity = WorkerProfileEntity(
    userId = userId,
    fullName = fullName,
    nationalId = nationalId,
    birthDate = birthDate,
    gender = gender,
    avatarUrl = avatarUrl,
    skills = skills,
    categories = categories,
    experienceYears = experienceYears,
    city = city,
    address = address,
    availableDays = availableDays,
    availableHours = availableHours,
    preferredJobs = preferredJobs,
    rating = rating,
    completedJobsCount = completedJobsCount,
    isAvailableForWork = isAvailableForWork,
    totalEarningsToman = totalEarningsToman
)

fun EmployerProfileEntity.toDomain(): EmployerProfile = EmployerProfile(
    userId = userId,
    fullName = fullName,
    businessName = businessName,
    businessCategory = businessCategory,
    city = city,
    address = address,
    contactInfo = contactInfo,
    avatarUrl = avatarUrl,
    isVerified = isVerified,
    rating = rating,
    postedJobsCount = postedJobsCount,
    activeShiftsCount = activeShiftsCount
)

fun EmployerProfile.toEntity(): EmployerProfileEntity = EmployerProfileEntity(
    userId = userId,
    fullName = fullName,
    businessName = businessName,
    businessCategory = businessCategory,
    city = city,
    address = address,
    contactInfo = contactInfo,
    avatarUrl = avatarUrl,
    isVerified = isVerified,
    rating = rating,
    postedJobsCount = postedJobsCount,
    activeShiftsCount = activeShiftsCount
)

fun JobEntity.toDomain(): Job = Job(
    id = id,
    employerId = employerId,
    employerName = employerName,
    businessName = businessName,
    title = title,
    description = description,
    categoryId = categoryId,
    categoryName = categoryName,
    numberOfWorkersNeeded = numberOfWorkersNeeded,
    currentWorkersCount = currentWorkersCount,
    date = date,
    startTime = startTime,
    endTime = endTime,
    salaryToman = salaryToman,
    isHourlySalary = isHourlySalary,
    city = city,
    address = address,
    latitude = latitude,
    longitude = longitude,
    requiredSkills = requiredSkills,
    status = status,
    createdAt = createdAt,
    isUrgent = isUrgent,
    hasApplied = hasApplied
)

fun Job.toEntity(): JobEntity = JobEntity(
    id = id,
    employerId = employerId,
    employerName = employerName,
    businessName = businessName,
    title = title,
    description = description,
    categoryId = categoryId,
    categoryName = categoryName,
    numberOfWorkersNeeded = numberOfWorkersNeeded,
    currentWorkersCount = currentWorkersCount,
    date = date,
    startTime = startTime,
    endTime = endTime,
    salaryToman = salaryToman,
    isHourlySalary = isHourlySalary,
    city = city,
    address = address,
    latitude = latitude,
    longitude = longitude,
    requiredSkills = requiredSkills,
    status = status,
    createdAt = createdAt,
    isUrgent = isUrgent,
    hasApplied = hasApplied
)

fun JobApplicationEntity.toDomain(): JobApplication = JobApplication(
    id = id,
    jobId = jobId,
    jobTitle = jobTitle,
    workerId = workerId,
    workerName = workerName,
    workerAvatarUrl = workerAvatarUrl,
    workerRating = workerRating,
    workerSkills = workerSkills,
    workerExperienceYears = workerExperienceYears,
    employerId = employerId,
    businessName = businessName,
    salaryToman = salaryToman,
    jobDate = jobDate,
    status = status,
    appliedAt = appliedAt,
    rejectionReason = rejectionReason
)

fun JobApplication.toEntity(): JobApplicationEntity = JobApplicationEntity(
    id = id,
    jobId = jobId,
    jobTitle = jobTitle,
    workerId = workerId,
    workerName = workerName,
    workerAvatarUrl = workerAvatarUrl,
    workerRating = workerRating,
    workerSkills = workerSkills,
    workerExperienceYears = workerExperienceYears,
    employerId = employerId,
    businessName = businessName,
    salaryToman = salaryToman,
    jobDate = jobDate,
    status = status,
    appliedAt = appliedAt,
    rejectionReason = rejectionReason
)

fun ShiftEntity.toDomain(): Shift = Shift(
    id = id,
    jobId = jobId,
    jobTitle = jobTitle,
    workerId = workerId,
    workerName = workerName,
    employerId = employerId,
    employerName = employerName,
    businessName = businessName,
    date = date,
    startTime = startTime,
    endTime = endTime,
    location = location,
    salaryToman = salaryToman,
    status = status,
    checkInTime = checkInTime,
    checkOutTime = checkOutTime
)

fun Shift.toEntity(): ShiftEntity = ShiftEntity(
    id = id,
    jobId = jobId,
    jobTitle = jobTitle,
    workerId = workerId,
    workerName = workerName,
    employerId = employerId,
    employerName = employerName,
    businessName = businessName,
    date = date,
    startTime = startTime,
    endTime = endTime,
    location = location,
    salaryToman = salaryToman,
    status = status,
    checkInTime = checkInTime,
    checkOutTime = checkOutTime
)

fun NotificationEntity.toDomain(): NotificationItem = NotificationItem(
    id = id,
    userId = userId,
    title = title,
    message = message,
    type = type,
    timestamp = timestamp,
    isRead = isRead,
    referenceId = referenceId
)

fun NotificationItem.toEntity(): NotificationEntity = NotificationEntity(
    id = id,
    userId = userId,
    title = title,
    message = message,
    type = type,
    timestamp = timestamp,
    isRead = isRead,
    referenceId = referenceId
)

fun Rating.toEntity(): RatingEntity = RatingEntity(
    id = id,
    raterId = raterId,
    raterName = raterName,
    targetUserId = targetUserId,
    jobId = jobId,
    score = score,
    comment = comment,
    createdAt = createdAt
)

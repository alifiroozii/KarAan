package com.karvin.app.domain.model

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.util.UUID

/** Shared domain contract used by both provider and requester experiences. */
enum class UserRole { WORKER, EMPLOYER }

enum class JobStatus {
    OPEN,
    APPLIED,
    ACCEPTED,
    WORKER_ON_THE_WAY,
    ARRIVED,
    IN_PROGRESS,
    COMPLETED,
    RATED,
    CANCELLED,
}

enum class ApplicationStatus { PENDING, ACCEPTED, REJECTED, WITHDRAWN }

enum class PaymentType { CASH, CARD, WALLET }

enum class GenderRequirement { ANY, MALE, FEMALE }

enum class NotificationType { JOB_NEARBY, APPLICATION_UPDATE, MESSAGE, WORKFLOW, RATING }

enum class LocationState { PermissionDenied, LocationDisabled, Loading, Available, Error }

enum class DistanceFilter(val maxKm: Double?, val label: String) {
    UNDER_ONE(1.0, "۱ کیلومتر"),
    UNDER_FIVE(5.0, "۵ کیلومتر"),
    UNDER_TEN(10.0, "۱۰ کیلومتر"),
    UNDER_TWENTY(20.0, "۲۰ کیلومتر"),
    ALL(null, "همه"),
}

data class GeoPoint(
    val latitude: Double,
    val longitude: Double,
)

data class Category(
    val id: String,
    val title: String,
    val icon: String,
)

data class User(
    val id: String,
    val name: String,
    val role: UserRole,
    val city: String,
    val phone: String,
    val avatarUrl: String? = null,
    val rating: Double = 4.8,
    val completedJobs: Int = 0,
    val isVerified: Boolean = true,
    val isAvailable: Boolean = false,
    val point: GeoPoint = GeoPoint(35.7219, 51.3347),
    val skills: List<String> = emptyList(),
    val services: List<String> = emptyList(),
    val bio: String = "",
    val reviewCount: Int = 0,
)

data class Job(
    val id: String,
    val title: String,
    val category: Category,
    val description: String,
    val employer: User,
    val requiredWorkers: Int,
    val genderRequirement: GenderRequirement,
    val date: LocalDate,
    val startTime: LocalTime,
    val durationHours: Double,
    val amount: Long,
    val paymentType: PaymentType,
    val address: String,
    val point: GeoPoint,
    val isUrgent: Boolean,
    val requiredSkills: List<String>,
    val status: JobStatus = JobStatus.OPEN,
    val applicantCount: Int = 0,
    val isSaved: Boolean = false,
)

data class Application(
    val id: String,
    val jobId: String,
    val worker: User,
    val status: ApplicationStatus,
    val createdAt: LocalDateTime,
    val message: String = "",
)

data class Review(
    val id: String,
    val authorName: String,
    val rating: Int,
    val comment: String,
    val createdAt: LocalDate,
)

data class ChatMessage(
    val id: String,
    val conversationId: String,
    val senderId: String,
    val text: String,
    val sentAt: LocalDateTime,
    val isSeen: Boolean,
)

data class Conversation(
    val id: String,
    val participant: User,
    val lastMessage: ChatMessage?,
    val unreadCount: Int,
)

data class AppNotification(
    val id: String,
    val type: NotificationType,
    val title: String,
    val message: String,
    val createdAt: LocalDateTime,
    val isRead: Boolean,
)

data class JobFilter(
    val query: String = "",
    val categoryId: String? = null,
    val distance: DistanceFilter = DistanceFilter.ALL,
    val minAmount: Long? = null,
    val maxAmount: Long? = null,
    val urgentOnly: Boolean = false,
    val minimumRating: Double? = null,
)

data class WorkerFilter(
    val query: String = "",
    val categoryId: String? = null,
    val distance: DistanceFilter = DistanceFilter.ALL,
    val minimumRating: Double? = null,
    val onlineOnly: Boolean = false,
    val verifiedOnly: Boolean = false,
    val service: String? = null,
)

data class CreateJobInput(
    val title: String,
    val category: Category,
    val description: String,
    val requiredWorkers: Int,
    val genderRequirement: GenderRequirement,
    val date: LocalDate,
    val startTime: LocalTime,
    val durationHours: Double,
    val amount: Long,
    val paymentType: PaymentType,
    val address: String,
    val point: GeoPoint,
    val isUrgent: Boolean,
    val requiredSkills: List<String>,
)

data class RatingInput(
    val targetId: String,
    val rating: Int,
    val comment: String,
)

sealed interface AppResult<out T> {
    data object Loading : AppResult<Nothing>
    data class Success<T>(val data: T) : AppResult<T>
    data class Error(val message: String, val cause: Throwable? = null) : AppResult<Nothing>
}

fun newId(prefix: String): String = "$prefix-${UUID.randomUUID()}"

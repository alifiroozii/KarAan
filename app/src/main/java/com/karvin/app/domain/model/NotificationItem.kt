package com.karvin.app.domain.model

enum class NotificationType {
    JOB_INVITATION,
    APPLICATION_ACCEPTED,
    APPLICATION_REJECTED,
    SHIFT_REMINDER,
    PAYMENT_RECEIVED,
    RATING_RECEIVED,
    SYSTEM_ALERT
}

data class NotificationItem(
    val id: String,
    val userId: String,
    val title: String,
    val message: String,
    val type: NotificationType,
    val timestamp: Long = System.currentTimeMillis(),
    val isRead: Boolean = false,
    val referenceId: String? = null
)

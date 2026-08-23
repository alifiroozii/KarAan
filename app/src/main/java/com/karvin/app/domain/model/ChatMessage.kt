package com.karvin.app.domain.model

enum class MessageType {
    TEXT,
    LOCATION,
    JOB_OFFER,
    IMAGE
}

data class ChatMessage(
    val id: String,
    val conversationId: String,
    val senderId: String,
    val senderName: String,
    val senderRole: UserRole,
    val content: String,
    val messageType: MessageType = MessageType.TEXT,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val locationName: String? = null,
    val jobReferenceId: String? = null,
    val jobTitle: String? = null,
    val jobSalaryToman: Long? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val isRead: Boolean = false,
    val isFromMe: Boolean = false
)

data class ChatConversation(
    val id: String,
    val otherUserId: String,
    val otherUserName: String,
    val otherUserRole: UserRole,
    val otherUserAvatarUrl: String? = null,
    val otherUserRating: Float = 5.0f,
    val isVerified: Boolean = true,
    val lastMessage: String,
    val lastMessageTime: Long,
    val unreadCount: Int = 0,
    val relatedJobTitle: String? = null
)

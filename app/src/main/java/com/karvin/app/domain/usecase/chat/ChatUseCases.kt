package com.karvin.app.domain.usecase.chat

import com.karvin.app.domain.model.ChatConversation
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.repository.ChatRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetConversationsUseCase @Inject constructor(
    private val chatRepository: ChatRepository
) {
    operator fun invoke(userId: String): Flow<List<ChatConversation>> {
        return chatRepository.getConversations(userId)
    }
}

class GetMessagesUseCase @Inject constructor(
    private val chatRepository: ChatRepository
) {
    operator fun invoke(conversationId: String): Flow<List<ChatMessage>> {
        return chatRepository.getMessages(conversationId)
    }
}

class SendMessageUseCase @Inject constructor(
    private val chatRepository: ChatRepository
) {
    suspend operator fun invoke(message: ChatMessage): Resource<ChatMessage> {
        if (message.content.isBlank() && message.locationName == null && message.jobReferenceId == null) {
            return Resource.Error("متن پیام یا پیوست نمی‌تواند خالی باشد")
        }
        return chatRepository.sendMessage(message)
    }
}

class OpenOrCreateChatUseCase @Inject constructor(
    private val chatRepository: ChatRepository
) {
    suspend operator fun invoke(
        myUserId: String,
        otherUserId: String,
        jobReferenceId: String? = null
    ): Resource<ChatConversation> {
        return chatRepository.getOrCreateConversation(myUserId, otherUserId, jobReferenceId)
    }
}

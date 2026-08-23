package com.karvin.app.domain.repository

import com.karvin.app.domain.model.ChatConversation
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow

interface ChatRepository {
    fun getConversations(userId: String): Flow<List<ChatConversation>>
    fun getMessages(conversationId: String): Flow<List<ChatMessage>>
    suspend fun sendMessage(message: ChatMessage): Resource<ChatMessage>
    suspend fun markConversationRead(conversationId: String): Resource<Boolean>
    suspend fun getOrCreateConversation(
        myUserId: String,
        otherUserId: String,
        jobReferenceId: String? = null
    ): Resource<ChatConversation>
}

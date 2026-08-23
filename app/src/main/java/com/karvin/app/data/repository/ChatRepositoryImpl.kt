package com.karvin.app.data.repository

import com.karvin.app.domain.model.ChatConversation
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.model.MessageType
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.repository.ChatRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepositoryImpl @Inject constructor() : ChatRepository {

    private val conversationsFlow = MutableStateFlow(FakeDataGenerator.generateInitialConversations())
    private val messagesMap = mutableMapOf<String, MutableStateFlow<List<ChatMessage>>>()

    init {
        conversationsFlow.value.forEach { conv ->
            messagesMap[conv.id] = MutableStateFlow(FakeDataGenerator.generateInitialMessages(conv.id))
        }
    }

    override fun getConversations(userId: String): Flow<List<ChatConversation>> {
        return conversationsFlow
    }

    override fun getMessages(conversationId: String): Flow<List<ChatMessage>> {
        if (!messagesMap.containsKey(conversationId)) {
            messagesMap[conversationId] = MutableStateFlow(FakeDataGenerator.generateInitialMessages(conversationId))
        }
        return messagesMap[conversationId]!!
    }

    override suspend fun sendMessage(message: ChatMessage): Resource<ChatMessage> {
        val convId = message.conversationId
        val stateFlow = messagesMap.getOrPut(convId) { MutableStateFlow(emptyList()) }
        val currentList = stateFlow.value.toMutableList()
        val newMessage = message.copy(isFromMe = true)
        currentList.add(newMessage)
        stateFlow.value = currentList

        // Update conversation preview
        val convList = conversationsFlow.value.toMutableList()
        val convIndex = convList.indexOfFirst { it.id == convId }
        val previewText = when (message.messageType) {
            MessageType.LOCATION -> "📍 موقعیت مکانی ارسال شد"
            MessageType.JOB_OFFER -> "💼 پیشنهاد همکاری"
            else -> message.content
        }

        if (convIndex != -1) {
            convList[convIndex] = convList[convIndex].copy(
                lastMessage = previewText,
                lastMessageTime = message.timestamp
            )
            conversationsFlow.value = convList
        }

        return Resource.Success(newMessage)
    }

    override suspend fun markConversationRead(conversationId: String): Resource<Boolean> {
        val convList = conversationsFlow.value.toMutableList()
        val convIndex = convList.indexOfFirst { it.id == conversationId }
        if (convIndex != -1) {
            convList[convIndex] = convList[convIndex].copy(unreadCount = 0)
            conversationsFlow.value = convList
        }
        return Resource.Success(true)
    }

    override suspend fun getOrCreateConversation(
        myUserId: String,
        otherUserId: String,
        jobReferenceId: String?
    ): Resource<ChatConversation> {
        val existing = conversationsFlow.value.firstOrNull { it.otherUserId == otherUserId }
        if (existing != null) {
            return Resource.Success(existing)
        }

        val newConv = ChatConversation(
            id = "conv_${UUID.randomUUID().toString().take(8)}",
            otherUserId = otherUserId,
            otherUserName = "مهندس علیرضا رضایی",
            otherUserRole = UserRole.EMPLOYER,
            otherUserAvatarUrl = null,
            otherUserRating = 4.9f,
            isVerified = true,
            lastMessage = "مکالمه جدید آغاز شد",
            lastMessageTime = System.currentTimeMillis(),
            unreadCount = 0,
            relatedJobTitle = "فرصت همکاری مستقیم"
        )

        val updated = conversationsFlow.value.toMutableList()
        updated.add(0, newConv)
        conversationsFlow.value = updated
        messagesMap[newConv.id] = MutableStateFlow(emptyList())

        return Resource.Success(newConv)
    }
}

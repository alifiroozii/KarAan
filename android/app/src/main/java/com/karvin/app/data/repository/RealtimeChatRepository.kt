package com.karvin.app.data.repository

import com.karvin.app.data.database.ChatMessageDao
import com.karvin.app.data.database.CachedMessageEntity
import com.karvin.app.data.remote.ChatWebSocketClient
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.repository.ChatRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import javax.inject.Inject

class RealtimeChatRepository @Inject constructor(
    private val dao: ChatMessageDao,
    private val socket: ChatWebSocketClient,
) : ChatRepository {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun observeMessages(conversationId: String): Flow<AppResult<List<ChatMessage>>> =
        dao.observe(conversationId).map { entities -> AppResult.Success(entities.map { it.toDomain() }) }
            .onEach { result ->
                if (result is AppResult.Success && result.data.isEmpty()) {
                    scope.launch { socket.messages(conversationId).collect { dao.upsert(it.toEntity()) } }
                }
            }

    override fun observeConversations(): Flow<AppResult<List<com.karvin.app.domain.model.Conversation>>> =
        kotlinx.coroutines.flow.flowOf(AppResult.Success(emptyList()))

    override suspend fun sendMessage(conversationId: String, text: String): AppResult<ChatMessage> {
        val message = CachedMessageEntity(
            id = "local-${System.currentTimeMillis()}", conversationId = conversationId,
            senderId = "me", text = text, sentAt = System.currentTimeMillis() / 1000,
            isSeen = socket.send(conversationId, text),
        )
        dao.upsert(message)
        return AppResult.Success(message.toDomain())
    }
}

private fun CachedMessageEntity.toDomain() = ChatMessage(id, conversationId, senderId, text,
    LocalDateTime.ofInstant(Instant.ofEpochSecond(sentAt), ZoneId.systemDefault()), isSeen)
private fun com.karvin.app.data.remote.SocketMessage.toEntity() = CachedMessageEntity(id, conversationId, senderId, text, sentAtEpochSeconds, status != "FAILED")

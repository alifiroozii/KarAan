package com.karvin.app.presentation.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.ChatConversation
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.model.MessageType
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.repository.ChatRepository
import com.karvin.app.domain.usecase.chat.GetConversationsUseCase
import com.karvin.app.domain.usecase.chat.GetMessagesUseCase
import com.karvin.app.domain.usecase.chat.OpenOrCreateChatUseCase
import com.karvin.app.domain.usecase.chat.SendMessageUseCase
import com.karvin.app.domain.usecase.location.GetCurrentLocationUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class ChatUiState(
    val conversations: List<ChatConversation> = emptyList(),
    val currentMessages: List<ChatMessage> = emptyList(),
    val currentConversation: ChatConversation? = null,
    val inputText: String = "",
    val isLoading: Boolean = false
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val getConversationsUseCase: GetConversationsUseCase,
    private val getMessagesUseCase: GetMessagesUseCase,
    private val sendMessageUseCase: SendMessageUseCase,
    private val openOrCreateChatUseCase: OpenOrCreateChatUseCase,
    private val getCurrentLocationUseCase: GetCurrentLocationUseCase,
    private val chatRepository: ChatRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    init {
        loadConversations()
    }

    fun loadConversations() {
        viewModelScope.launch {
            getConversationsUseCase("worker_default").collect { list ->
                _uiState.value = _uiState.value.copy(conversations = list)
            }
        }
    }

    fun openConversation(conversationId: String) {
        val conv = _uiState.value.conversations.find { it.id == conversationId }
        _uiState.value = _uiState.value.copy(currentConversation = conv)

        viewModelScope.launch {
            chatRepository.markConversationRead(conversationId)
            getMessagesUseCase(conversationId).collect { msgs ->
                _uiState.value = _uiState.value.copy(currentMessages = msgs)
            }
        }
    }

    fun onInputTextChange(text: String) {
        _uiState.value = _uiState.value.copy(inputText = text)
    }

    fun sendTextMessage() {
        val text = _uiState.value.inputText.trim()
        val conv = _uiState.value.currentConversation ?: return
        if (text.isBlank()) return

        val msg = ChatMessage(
            id = "msg_${UUID.randomUUID().toString().take(8)}",
            conversationId = conv.id,
            senderId = "worker_default",
            senderName = "محمد حسینی",
            senderRole = UserRole.WORKER,
            content = text,
            messageType = MessageType.TEXT,
            timestamp = System.currentTimeMillis(),
            isFromMe = true
        )

        _uiState.value = _uiState.value.copy(inputText = "")
        viewModelScope.launch {
            sendMessageUseCase(msg)
        }
    }

    fun sendLocationMessage() {
        val conv = _uiState.value.currentConversation ?: return

        viewModelScope.launch {
            val loc = getCurrentLocationUseCase().first()
            val msg = ChatMessage(
                id = "msg_${UUID.randomUUID().toString().take(8)}",
                conversationId = conv.id,
                senderId = "worker_default",
                senderName = "محمد حسینی",
                senderRole = UserRole.WORKER,
                content = "موقعیت مکانی من ارسال شد",
                messageType = MessageType.LOCATION,
                latitude = loc.latitude,
                longitude = loc.longitude,
                locationName = "${loc.city}، ${loc.addressName}",
                timestamp = System.currentTimeMillis(),
                isFromMe = true
            )
            sendMessageUseCase(msg)
        }
    }
}

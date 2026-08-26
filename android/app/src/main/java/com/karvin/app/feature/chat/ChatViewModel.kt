package com.karvin.app.feature.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.model.Conversation
import com.karvin.app.domain.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ConversationsUiState(val loading: Boolean = true, val conversations: List<Conversation> = emptyList(), val error: String? = null)

@HiltViewModel
class ChatListViewModel @Inject constructor(private val repository: ChatRepository) : ViewModel() {
    private val _state = MutableStateFlow(ConversationsUiState())
    val state: StateFlow<ConversationsUiState> = _state.asStateFlow()
    init { viewModelScope.launch { repository.observeConversations().collect { result -> _state.value = when (result) {
        is AppResult.Success -> ConversationsUiState(false, result.data)
        is AppResult.Error -> ConversationsUiState(false, error = result.message)
        AppResult.Loading -> ConversationsUiState(true)
    } } } }
}

data class ConversationUiState(val loading: Boolean = true, val messages: List<ChatMessage> = emptyList(), val sending: Boolean = false, val error: String? = null)

@HiltViewModel
class ConversationViewModel @Inject constructor(private val repository: ChatRepository) : ViewModel() {
    private val _state = MutableStateFlow(ConversationUiState())
    val state: StateFlow<ConversationUiState> = _state.asStateFlow()
    fun load(id: String) { viewModelScope.launch { repository.observeMessages(id).collect { result -> _state.value = when (result) {
        is AppResult.Success -> _state.value.copy(loading = false, messages = result.data, error = null)
        is AppResult.Error -> _state.value.copy(loading = false, error = result.message)
        AppResult.Loading -> _state.value.copy(loading = true)
    } } } }
    fun send(id: String, text: String) { if (text.isBlank()) return; viewModelScope.launch {
        _state.value = _state.value.copy(sending = true)
        when (val result = repository.sendMessage(id, text.trim())) {
            is AppResult.Error -> _state.value = _state.value.copy(sending = false, error = result.message)
            else -> _state.value = _state.value.copy(sending = false)
        }
    } }
}

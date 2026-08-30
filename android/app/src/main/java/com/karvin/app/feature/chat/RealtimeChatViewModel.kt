package com.karvin.app.feature.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.core.common.UiState
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.ChatMessage
import com.karvin.app.domain.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class RealtimeChatViewModel @Inject constructor(
    private val repository: ChatRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<UiState<List<ChatMessage>>>(UiState.Loading)
    val state: StateFlow<UiState<List<ChatMessage>>> = _state.asStateFlow()

    fun load(conversationId: String) {
        viewModelScope.launch {
            repository.observeMessages(conversationId).collect { result ->
                _state.value = when (result) {
                    AppResult.Loading -> UiState.Loading
                    is AppResult.Success -> UiState.Success(result.data)
                    is AppResult.Error -> UiState.Error(result.message)
                }
            }
        }
    }

    fun send(conversationId: String, text: String) {
        if (text.isBlank()) return
        viewModelScope.launch { repository.sendMessage(conversationId, text.trim()) }
    }
}

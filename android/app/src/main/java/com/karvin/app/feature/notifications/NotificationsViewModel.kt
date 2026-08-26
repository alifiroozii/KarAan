package com.karvin.app.feature.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.AppNotification
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationsUiState(val loading: Boolean = true, val notifications: List<AppNotification> = emptyList(), val error: String? = null)

@HiltViewModel
class NotificationsViewModel @Inject constructor(private val repository: NotificationRepository) : ViewModel() {
    private val _state = MutableStateFlow(NotificationsUiState())
    val state: StateFlow<NotificationsUiState> = _state.asStateFlow()
    init { viewModelScope.launch { repository.observeNotifications().collect { result -> _state.value = when (result) {
        is AppResult.Success -> NotificationsUiState(false, result.data)
        is AppResult.Error -> NotificationsUiState(false, error = result.message)
        AppResult.Loading -> NotificationsUiState(true)
    } } } }
    fun markRead(id: String) { viewModelScope.launch { repository.markAsRead(id) } }
    fun markAllRead() { viewModelScope.launch { repository.markAllAsRead() } }
}

package com.karvin.app.presentation.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.NotificationItem
import com.karvin.app.domain.model.NotificationType
import com.karvin.app.domain.usecase.notification.GetNotificationsUseCase
import com.karvin.app.domain.usecase.notification.MarkNotificationReadUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationUiState(
    val notifications: List<NotificationItem> = emptyList(),
    val unreadCount: Int = 0,
    val isLoading: Boolean = false
)

@HiltViewModel
class NotificationViewModel @Inject constructor(
    private val getNotificationsUseCase: GetNotificationsUseCase,
    private val markNotificationReadUseCase: MarkNotificationReadUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationUiState())
    val uiState: StateFlow<NotificationUiState> = _uiState.asStateFlow()

    init {
        loadNotifications()
    }

    private fun loadNotifications() {
        val userId = "worker_default"
        viewModelScope.launch {
            getNotificationsUseCase(userId).collect { list ->
                _uiState.value = _uiState.value.copy(
                    notifications = list,
                    unreadCount = list.count { !it.isRead }
                )
            }
        }
    }

    fun markAsRead(notificationId: String) {
        viewModelScope.launch {
            markNotificationReadUseCase(notificationId)
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            markNotificationReadUseCase.markAllAsRead("worker_default")
        }
    }
}

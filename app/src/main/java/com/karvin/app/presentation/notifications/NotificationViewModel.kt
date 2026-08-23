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

enum class NotificationFilter(val titleFa: String) {
    ALL("همه"),
    JOBS("فرصت‌های کاری"),
    SHIFTS("یادآوری شیفت"),
    PAYMENTS("تسویه و مالی")
}

data class NotificationUiState(
    val notifications: List<NotificationItem> = emptyList(),
    val filteredNotifications: List<NotificationItem> = emptyList(),
    val selectedFilter: NotificationFilter = NotificationFilter.ALL,
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
                val state = _uiState.value
                val filtered = filterList(list, state.selectedFilter)
                _uiState.value = state.copy(
                    notifications = list,
                    filteredNotifications = filtered,
                    unreadCount = list.count { !it.isRead }
                )
            }
        }
    }

    fun onFilterChange(filter: NotificationFilter) {
        val list = _uiState.value.notifications
        _uiState.value = _uiState.value.copy(
            selectedFilter = filter,
            filteredNotifications = filterList(list, filter)
        )
    }

    private fun filterList(list: List<NotificationItem>, filter: NotificationFilter): List<NotificationItem> {
        return when (filter) {
            NotificationFilter.ALL -> list
            NotificationFilter.JOBS -> list.filter { it.type == NotificationType.JOB_INVITATION || it.type == NotificationType.APPLICATION_ACCEPTED }
            NotificationFilter.SHIFTS -> list.filter { it.type == NotificationType.SHIFT_REMINDER || it.type == NotificationType.SYSTEM_ALERT }
            NotificationFilter.PAYMENTS -> list.filter { it.type == NotificationType.PAYMENT_RECEIVED }
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

package com.karvin.app.feature.notifications

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.EmptyState
import com.karvin.app.core.designsystem.ErrorState
import com.karvin.app.core.designsystem.LoadingState
import com.karvin.app.domain.model.NotificationType
import com.karvin.app.domain.model.toPersianDigits
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun NotificationsScreen(navController: NavHostController, viewModel: NotificationsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    Column(Modifier.fillMaxSize()) {
        AppTopBar("اعلان‌ها", onBack = { navController.popBackStack() }, actions = { TextButton(onClick = viewModel::markAllRead) { Text("خواندن همه") } })
        when { state.loading -> LoadingState(); state.error != null -> ErrorState(state.error.orEmpty()) { }; state.notifications.isEmpty() -> EmptyState("اعلان جدیدی ندارید", "تغییرات مهم حساب و درخواست‌ها اینجا نمایش داده می‌شود."); else -> LazyColumn(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { items(state.notifications, key = { it.id }) { notification -> NotificationCard(notification.isRead, notification.type, notification.title, notification.message, notification.createdAt.format(DateTimeFormatter.ofPattern("MM/dd - HH:mm", Locale.US)).toPersianDigits()) { viewModel.markRead(notification.id) } } } }
    }
}

@Composable
private fun NotificationCard(read: Boolean, type: NotificationType, title: String, message: String, time: String, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = if (read) MaterialTheme.colorScheme.surface else MaterialTheme.colorScheme.primaryContainer)) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
            Icon(if (read) Icons.Default.CheckCircle else Icons.Default.Notifications, contentDescription = null, tint = if (read) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.primary, modifier = Modifier.size(28.dp))
            Column(Modifier.weight(1f).padding(horizontal = 12.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) { Text(title, style = MaterialTheme.typography.titleMedium); Text(message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant); Text(time, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            Text(typeLabel(type), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
        }
    }
}

private fun typeLabel(type: NotificationType): String = when (type) { NotificationType.JOB_NEARBY -> "نزدیک شما"; NotificationType.APPLICATION_UPDATE -> "درخواست"; NotificationType.MESSAGE -> "پیام"; NotificationType.WORKFLOW -> "وضعیت کار"; NotificationType.RATING -> "امتیاز" }

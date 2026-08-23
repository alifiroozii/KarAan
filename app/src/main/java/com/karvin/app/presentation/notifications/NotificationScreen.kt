package com.karvin.app.presentation.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.domain.model.NotificationItem
import com.karvin.app.domain.model.NotificationType
import com.karvin.app.presentation.components.EmptyStateView
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Amber100
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Blue100
import com.karvin.app.presentation.theme.Blue500
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy100
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter

@Composable
fun NotificationScreen(
    onNavigateBack: () -> Unit,
    viewModel: NotificationViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.nav_notifications),
                onBackClick = onNavigateBack,
                actions = {
                    if (state.unreadCount > 0) {
                        TextButton(onClick = viewModel::markAllAsRead) {
                            Text(
                                text = "خوانده شدن همه",
                                style = MaterialTheme.typography.labelMedium,
                                color = Emerald600,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(10.dp))

            if (state.notifications.isEmpty()) {
                EmptyStateView(
                    title = "هیچ اعلانی ندارید",
                    message = "پیام‌های سیستم، یادآوری شیفت‌ها و تاییدیه‌ها در این بخش ثبت خواهند شد.",
                    icon = Icons.Default.Notifications
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(state.notifications) { item ->
                        NotificationCard(
                            item = item,
                            onClick = { viewModel.markAsRead(item.id) }
                        )
                    }
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationCard(
    item: NotificationItem,
    onClick: () -> Unit
) {
    val (icon, bgCol, tintCol) = when (item.type) {
        NotificationType.APPLICATION_ACCEPTED -> Triple(Icons.Default.CheckCircle, Emerald100, Emerald600)
        NotificationType.SHIFT_REMINDER -> Triple(Icons.Default.DateRange, Amber100, Amber500)
        NotificationType.PAYMENT_RECEIVED -> Triple(Icons.Default.AttachMoney, Emerald100, Emerald600)
        NotificationType.JOB_INVITATION -> Triple(Icons.Default.Work, Blue100, Blue500)
        NotificationType.RATING_RECEIVED -> Triple(Icons.Default.Star, Amber100, Amber500)
        else -> Triple(Icons.Default.Info, Navy100, Navy900)
    }

    KarvinCard(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
        backgroundColor = if (item.isRead) MaterialTheme.colorScheme.surface else Navy100.copy(alpha = 0.35f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(bgCol),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = null, tint = tintCol, modifier = Modifier.size(22.dp))
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = if (item.isRead) FontWeight.Medium else FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = PersianDateFormatter.formatRelativeTime(item.timestamp),
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondaryLight
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = item.message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (item.isRead) TextSecondaryLight else MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

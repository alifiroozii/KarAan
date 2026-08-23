package com.karvin.app.presentation.map

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.TrustBadge
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.presentation.components.JobCard
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.KarvinFilterChip
import com.karvin.app.presentation.components.KarvinSkillBadge
import com.karvin.app.presentation.components.MatchScoreBadge
import com.karvin.app.presentation.components.TrustBadgeRow
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Blue500
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter

@Composable
fun MapScreen(
    userRole: UserRole,
    onNavigateToJobDetails: (String) -> Unit,
    onNavigateToChat: (String) -> Unit = {},
    viewModel: MapViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val categoriesScroll = rememberScrollState()

    LaunchedEffect(userRole) {
        viewModel.setUserRole(userRole)
    }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Interactive Map Canvas
            ComposeInteractiveMap(
                userLocation = state.currentLocation,
                jobs = if (userRole == UserRole.WORKER) state.nearbyJobs else emptyList(),
                workers = if (userRole == UserRole.EMPLOYER) state.nearbyWorkers else emptyList(),
                selectedJob = state.selectedJob,
                selectedWorker = state.selectedWorker,
                onJobSelected = viewModel::onJobSelected,
                onWorkerSelected = viewModel::onWorkerSelected
            )

            // Top Floating Controls
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
                    .padding(16.dp)
            ) {
                if (userRole == UserRole.WORKER) {
                    // Available Now Switch Bar
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(if (state.isAvailableNow) Emerald600 else Color.Gray)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = if (state.isAvailableNow) "🟢 آماده کار هستم" else "⚪ غیرفعال روی نقشه",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = "موقعیت شما برای کارفرمایان نزدیک قابل مشاهده است",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextSecondaryLight
                                    )
                                }
                            }

                            Switch(
                                checked = state.isAvailableNow,
                                onCheckedChange = viewModel::toggleAvailableNow,
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Emerald600,
                                    checkedTrackColor = Emerald100
                                )
                            )
                        }
                    }
                } else {
                    // Employer Category Filters
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(categoriesScroll),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        KarvinFilterChip(
                            text = "همه نیروهای نزدیک",
                            isSelected = state.selectedCategoryId == null,
                            onClick = { viewModel.onCategoryFilterChange(null) }
                        )
                        state.categories.forEach { cat ->
                            KarvinFilterChip(
                                text = cat.nameFa,
                                isSelected = state.selectedCategoryId == cat.id,
                                onClick = { viewModel.onCategoryFilterChange(cat.id) }
                            )
                        }
                    }
                }
            }

            // Bottom Selected Entity Sheet
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            ) {
                if (userRole == UserRole.WORKER && state.selectedJob != null) {
                    val job = state.selectedJob!!
                    JobCard(
                        job = job,
                        onClick = { onNavigateToJobDetails(job.id) },
                        onApplyClick = { viewModel.applyForJob(job.id) }
                    )
                } else if (userRole == UserRole.EMPLOYER && state.selectedWorker != null) {
                    val worker = state.selectedWorker!!
                    WorkerMapPreviewCard(
                        worker = worker,
                        onInviteClick = { viewModel.inviteWorker(worker) },
                        onChatClick = { onNavigateToChat(worker.userId) }
                    )
                }
            }
        }
    }
}

@Composable
private fun WorkerMapPreviewCard(
    worker: WorkerProfile,
    onInviteClick: () -> Unit,
    onChatClick: () -> Unit
) {
    KarvinCard(
        modifier = Modifier.fillMaxWidth(),
        shapeRadius = 16.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header: Avatar, Name, Distance & Match Score
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(Navy900),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = worker.fullName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.Verified, contentDescription = "Verified", tint = Emerald600, modifier = Modifier.size(16.dp))
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = Amber500, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(
                                text = PersianDateFormatter.toPersianDigits(worker.rating),
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "(${PersianDateFormatter.toPersianDigits(worker.experienceYears)} سال سابقه)",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondaryLight
                            )
                        }
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    if (worker.matchScorePercentage != null) {
                        MatchScoreBadge(scorePercentage = worker.matchScorePercentage ?: 92)
                    }
                    if (worker.distanceTextFa != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = worker.distanceTextFa ?: "",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Blue500
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Trust Badges Row
            TrustBadgeRow(
                badges = listOf(
                    TrustBadge.BADGE_IDENTITY,
                    TrustBadge.BADGE_100_JOBS
                )
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Skills Row
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                worker.skills.take(3).forEach { skill ->
                    KarvinSkillBadge(text = skill.nameFa, isHighlighted = true)
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Actions Row: Direct Invite & Chat
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                KarvinButton(
                    text = "پیام مستقیم",
                    onClick = onChatClick,
                    type = KarvinButtonType.OUTLINED,
                    icon = Icons.Default.Send,
                    modifier = Modifier.weight(1f),
                    height = 40.dp,
                    shapeRadius = 10.dp
                )
                KarvinButton(
                    text = "دعوت به کار فوری",
                    onClick = onInviteClick,
                    type = KarvinButtonType.SECONDARY,
                    modifier = Modifier.weight(1.3f),
                    height = 40.dp,
                    shapeRadius = 10.dp
                )
            }
        }
    }
}

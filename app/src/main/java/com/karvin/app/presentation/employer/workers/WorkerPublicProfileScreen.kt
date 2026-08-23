package com.karvin.app.presentation.employer.workers

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
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
import com.karvin.app.domain.model.TrustBadge
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.KarvinSkillBadge
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.components.TrustBadgeRow
import com.karvin.app.presentation.employer.invitations.SendInvitationDialog
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun WorkerPublicProfileScreen(
    workerId: String,
    onNavigateBack: () -> Unit,
    onNavigateToChat: (String) -> Unit = {},
    viewModel: WorkerPublicProfileViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scroll = rememberScrollState()

    LaunchedEffect(workerId) {
        viewModel.loadWorkerProfile(workerId)
    }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    val worker = state.worker

    if (state.showInviteDialog && worker != null) {
        SendInvitationDialog(
            worker = worker,
            onDismiss = viewModel::closeInviteDialog,
            onSendInvitation = viewModel::sendInvitation
        )
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = "پروفایل نیروی متخصص",
                onBackClick = onNavigateBack
            )
        },
        bottomBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                KarvinButton(
                    text = "گفتگوی آنلاین",
                    onClick = { onNavigateToChat(workerId) },
                    type = KarvinButtonType.OUTLINED,
                    icon = Icons.Default.ChatBubbleOutline,
                    modifier = Modifier.weight(1f)
                )
                KarvinButton(
                    text = "ارسال دعوت‌نامه کاری",
                    onClick = viewModel::openInviteDialog,
                    type = KarvinButtonType.PRIMARY,
                    icon = Icons.Default.Send,
                    modifier = Modifier.weight(1.3f)
                )
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
                .verticalScroll(scroll)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Header Card
            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(Navy900),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(44.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = worker?.fullName ?: "استادکار ماهر",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(Icons.Default.Verified, contentDescription = "Verified", tint = Emerald600, modifier = Modifier.size(18.dp))
                    }

                    Text(
                        text = worker?.primarySkill ?: "برق‌کار و تاسیسات",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Navy900,
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = Amber500, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${PersianDateFormatter.toPersianDigits(worker?.rating ?: 4.9f)} ستاره رضایت (${PersianDateFormatter.toPersianDigits(worker?.completedJobsCount ?: 120)} کار موفق)",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondaryLight
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 3-Metric Summary
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "سابقه کاری", style = MaterialTheme.typography.bodySmall, color = TextSecondaryLight)
                            Text(text = "${PersianDateFormatter.toPersianDigits(worker?.experienceYears ?: 5)} سال", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "حضور به موقع", style = MaterialTheme.typography.bodySmall, color = TextSecondaryLight)
                            Text(text = "${PersianDateFormatter.toPersianDigits(worker?.attendanceScorePercentage ?: 98)}٪", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Emerald600)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "موقعیت فعلی", style = MaterialTheme.typography.bodySmall, color = TextSecondaryLight)
                            Text(text = worker?.city ?: "تهران", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Trust Badges
            Text(text = "نشان‌های اعتبار و تعهد کاروین", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            TrustBadgeRow(
                badges = listOf(
                    TrustBadge.BADGE_IDENTITY,
                    TrustBadge.BADGE_100_JOBS,
                    TrustBadge.BADGE_PUNCTUAL,
                    TrustBadge.BADGE_TOP_RATED
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Skills Section
            Text(text = "مهارت‌ها و تخصص‌های تایید شده", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                worker?.skills?.forEach { skill ->
                    KarvinSkillBadge(text = skill.nameFa, isHighlighted = true)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Biography & Work Experience
            Text(text = "درباره نیرو و خلاصه تجربیات", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = worker?.bio ?: "استادکار با انگیزه و متخصص با تجربه کار در پروژه‌های ساختمانی، صنعتی و اداری تهران. دارای کارت مهارت فنی و حرفه‌ای و ابزار کار کامل.",
                        style = MaterialTheme.typography.bodyMedium,
                        lineHeight = MaterialTheme.typography.bodyMedium.lineHeight
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

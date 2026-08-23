package com.karvin.app.presentation.employer.dashboard

import androidx.compose.foundation.background
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PostAdd
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.presentation.components.JobCard
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.StatCard
import com.karvin.app.presentation.employer.workers.MarketplaceWorkerCard
import com.karvin.app.presentation.theme.Blue500
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.Purple500
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter

@Composable
fun EmployerDashboardScreen(
    onNavigateToCreateJob: () -> Unit,
    onNavigateToApplicants: () -> Unit,
    onNavigateToShifts: () -> Unit,
    onNavigateToJobDetails: (String) -> Unit,
    onNavigateToNotifications: () -> Unit,
    viewModel: EmployerDashboardViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val scroll = rememberScrollState()

    Scaffold { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
                .verticalScroll(scroll)
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // Greeting & Top Bar
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
                            imageVector = Icons.Default.Business,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(26.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = state.profile?.businessName ?: "شرکت سازه گستر البرز",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.Verified, contentDescription = "Verified", tint = Emerald600, modifier = Modifier.size(16.dp))
                        }
                        Text(
                            text = "پیشخوان کارفرما و مدیریت نیروها",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondaryLight
                        )
                    }
                }

                IconButton(
                    onClick = onNavigateToNotifications,
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surface)
                ) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = "Notifications",
                        tint = Navy900
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Fast Action Banner: Post new job
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium,
                colors = CardDefaults.cardColors(containerColor = Navy900)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = stringResource(id = R.string.create_job_banner_title),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "ثبت سریع آگهی برای دریافت متقاضیان ماهر در چند دقیقه",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    KarvinButton(
                        text = "ثبت آگهی",
                        onClick = onNavigateToCreateJob,
                        type = KarvinButtonType.SECONDARY,
                        icon = Icons.Default.Add,
                        modifier = Modifier.width(115.dp),
                        height = 38.dp,
                        shapeRadius = 8.dp
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // 4 Stats Cards
            Text(
                text = "آمار و وضعیت نیروها",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = stringResource(id = R.string.stat_posted_jobs),
                    value = "${PersianDateFormatter.toPersianDigits(state.postedJobsCount)} آگهی",
                    icon = Icons.Default.PostAdd,
                    iconTint = Blue500,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = stringResource(id = R.string.stat_received_applications),
                    value = "${PersianDateFormatter.toPersianDigits(state.receivedApplicantsCount)} متقاضی",
                    icon = Icons.Default.Assignment,
                    iconTint = Purple500,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToApplicants
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = stringResource(id = R.string.stat_approved_workers),
                    value = "${PersianDateFormatter.toPersianDigits(state.approvedWorkersCount)} نیرو",
                    icon = Icons.Default.CheckCircle,
                    iconTint = Emerald600,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToApplicants
                )
                StatCard(
                    title = stringResource(id = R.string.stat_employer_active_shifts),
                    value = "${PersianDateFormatter.toPersianDigits(state.activeShiftsCount)} شیفت",
                    icon = Icons.Default.DateRange,
                    iconTint = Emerald600,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToShifts
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Section: Nearby Available Workers
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.People, contentDescription = null, tint = Emerald600, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "نیروهای آماده به کار در نزدیکی شما",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }

                TextButton(onClick = onNavigateToApplicants) {
                    Text(text = "مشاهده بازار نیروها", style = MaterialTheme.typography.labelMedium, color = Emerald600)
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            state.nearbyAvailableWorkers.take(3).forEach { worker ->
                MarketplaceWorkerCard(
                    worker = worker,
                    onViewProfileClick = onNavigateToApplicants,
                    onInviteClick = onNavigateToApplicants
                )
                Spacer(modifier = Modifier.height(10.dp))
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Section: My Active Job Requests
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "آگهی‌های فعال شما",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            state.recentJobs.take(3).forEach { job ->
                JobCard(
                    job = job,
                    onClick = { onNavigateToJobDetails(job.id) }
                )
                Spacer(modifier = Modifier.height(10.dp))
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

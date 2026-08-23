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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Work
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
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.StatCard
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
fun EmployerDashboardScreen(
    onNavigateToCreateJob: () -> Unit,
    onNavigateToApplicants: () -> Unit,
    onNavigateToShifts: () -> Unit,
    onNavigateToJobDetails: (String) -> Unit,
    onNavigateToNotifications: () -> Unit,
    viewModel: EmployerDashboardViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))

                // Business Header & Verified badge
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
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

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = state.profile?.businessName ?: "شرکت سازه گستر البرز",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.Default.Verified,
                                    contentDescription = "Verified",
                                    tint = Emerald600,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Text(
                                text = state.profile?.fullName ?: "مهندس علیرضا رضایی",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondaryLight
                            )
                        }
                    }

                    IconButton(onClick = onNavigateToNotifications) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Notifications",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            // Quick Create Job Action Banner
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Navy900)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(18.dp)
                    ) {
                        Text(
                            text = stringResource(id = R.string.create_job_banner_title),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "نیروی ماهر و آماده به کار را در کمتر از چند دقیقه استخدام کنید.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        KarvinButton(
                            text = stringResource(id = R.string.create_job_banner_btn),
                            onClick = onNavigateToCreateJob,
                            type = KarvinButtonType.SECONDARY,
                            icon = Icons.Default.AddCircle,
                            height = 44.dp,
                            shapeRadius = 10.dp
                        )
                    }
                }
            }

            // 4 Key Metrics Cards
            item {
                Text(
                    text = "آمار و پیشخوان مدیریت",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatCard(
                        title = stringResource(id = R.string.stat_posted_jobs),
                        value = "${PersianDateFormatter.toPersianDigits(state.postedJobsCount)} آگهی",
                        icon = Icons.Default.Work,
                        iconBackgroundColor = Navy100,
                        iconTintColor = Navy900,
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        title = stringResource(id = R.string.stat_received_applications),
                        value = "${PersianDateFormatter.toPersianDigits(state.receivedApplicantsCount)} نفر",
                        icon = Icons.Default.People,
                        iconBackgroundColor = Blue100,
                        iconTintColor = Blue500,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToApplicants
                    )
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatCard(
                        title = stringResource(id = R.string.stat_approved_workers),
                        value = "${PersianDateFormatter.toPersianDigits(state.approvedWorkersCount)} نیرو",
                        icon = Icons.Default.CheckCircle,
                        iconBackgroundColor = Emerald100,
                        iconTintColor = Emerald600,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToApplicants
                    )
                    StatCard(
                        title = stringResource(id = R.string.stat_employer_active_shifts),
                        value = "${PersianDateFormatter.toPersianDigits(state.activeShiftsCount)} شیفت",
                        icon = Icons.Default.DateRange,
                        iconBackgroundColor = Amber100,
                        iconTintColor = Amber500,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToShifts
                    )
                }
            }

            // My Posted Jobs Section
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "آگهی‌های فعال شما",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    TextButton(onClick = onNavigateToCreateJob) {
                        Text(
                            text = "+ ثبت جدید",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Emerald600
                        )
                    }
                }
            }

            items(state.recentJobs) { job ->
                JobCard(
                    job = job,
                    onClick = { onNavigateToJobDetails(job.id) }
                )
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

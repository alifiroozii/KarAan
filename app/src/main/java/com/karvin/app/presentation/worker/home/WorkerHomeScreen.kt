package com.karvin.app.presentation.worker.home

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
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
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
import com.karvin.app.utils.PriceFormatter

@Composable
fun WorkerHomeScreen(
    onNavigateToJobs: () -> Unit,
    onNavigateToApplications: () -> Unit,
    onNavigateToShifts: () -> Unit,
    onNavigateToJobDetails: (String) -> Unit,
    onNavigateToNotifications: () -> Unit,
    viewModel: WorkerHomeViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
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

                // Greeting Header & Profile Avatar & Availability Switch
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
                                imageVector = Icons.Default.Person,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(28.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Text(
                                text = "سلام، ${state.workerProfile?.fullName ?: "همکار گرامی"}",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Text(
                                text = "خوش‌آمدید به کاروین",
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

            // Availability Status Banner
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (state.isAvailableForWork) Emerald100.copy(alpha = 0.6f) else Navy100.copy(alpha = 0.6f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = if (state.isAvailableForWork) "وضعیت: آماده دریافت کار و شیفت" else "وضعیت: عدم دسترسی موقت",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = if (state.isAvailableForWork) Emerald600 else Navy900
                            )
                            Text(
                                text = if (state.isAvailableForWork) "پروفایل شما در جستجوی کارفرمایان فعال است" else "پیشنهادات کاری جدید غیرفعال شدند",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondaryLight
                            )
                        }

                        Switch(
                            checked = state.isAvailableForWork,
                            onCheckedChange = viewModel::toggleAvailability,
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Emerald600,
                                checkedTrackColor = Emerald100
                            )
                        )
                    }
                }
            }

            // 5 Metric Cards
            item {
                Text(
                    text = "خلاصه فعالیت‌های شما",
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
                        title = stringResource(id = R.string.stat_nearby_jobs),
                        value = "${PersianDateFormatter.toPersianDigits(state.nearbyJobsCount)} مورد",
                        icon = Icons.Default.Work,
                        iconBackgroundColor = Navy100,
                        iconTintColor = Navy900,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToJobs
                    )
                    StatCard(
                        title = stringResource(id = R.string.stat_my_applications),
                        value = "${PersianDateFormatter.toPersianDigits(state.applicationsCount)} مورد",
                        icon = Icons.Default.Assignment,
                        iconBackgroundColor = Blue100,
                        iconTintColor = Blue500,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToApplications
                    )
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatCard(
                        title = stringResource(id = R.string.stat_active_shifts),
                        value = "${PersianDateFormatter.toPersianDigits(state.activeShiftsCount)} شیفت",
                        icon = Icons.Default.DateRange,
                        iconBackgroundColor = Amber100,
                        iconTintColor = Amber500,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToShifts
                    )
                    StatCard(
                        title = stringResource(id = R.string.stat_rating),
                        value = "${PersianDateFormatter.toPersianDigits(state.performanceRating)} / ۵",
                        icon = Icons.Default.Star,
                        iconBackgroundColor = Amber100,
                        iconTintColor = Amber500,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item {
                StatCard(
                    title = stringResource(id = R.string.stat_earnings),
                    value = PriceFormatter.formatToman(state.monthlyEarningsToman),
                    icon = Icons.Default.AttachMoney,
                    iconBackgroundColor = Emerald100,
                    iconTintColor = Emerald600,
                    subtitle = "تسویه شده در ۳۰ روز گذشته"
                )
            }

            // Urgent Jobs Header & List
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = stringResource(id = R.string.urgent_jobs_title),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    TextButton(onClick = onNavigateToJobs) {
                        Text(
                            text = stringResource(id = R.string.view_all),
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Emerald600
                        )
                    }
                }
            }

            items(state.urgentJobs) { job ->
                JobCard(
                    job = job,
                    onClick = { onNavigateToJobDetails(job.id) },
                    onApplyClick = { viewModel.applyForJob(job.id) }
                )
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

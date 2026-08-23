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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Whatshot
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
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Blue500
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.Purple500
import com.karvin.app.presentation.theme.Red500
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
    val scroll = rememberScrollState()
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
                .verticalScroll(scroll)
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // Greeting & Top Action
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = stringResource(id = R.string.worker_greeting, state.workerProfile?.fullName ?: "محمد عزیز"),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(Icons.Default.Verified, contentDescription = "Verified", tint = Emerald600, modifier = Modifier.size(20.dp))
                    }
                    Text(
                        text = "آماده دریافت کارهای پردرآمد و نزدیک هستید؟",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondaryLight
                    )
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

            // Availability Status Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = if (state.isAvailableForWork) Emerald100 else MaterialTheme.colorScheme.surface
                ),
                shape = MaterialTheme.shapes.medium
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(if (state.isAvailableForWork) Emerald600 else Color.Gray)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = if (state.isAvailableForWork) "وضعیت: آماده به کار" else "وضعیت: غیرفعال",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (state.isAvailableForWork) Emerald600 else MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (state.isAvailableForWork) "کارهای جدید به شما اطلاع داده می‌شود" else "درخواست کاری دریافت نخواهید کرد",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondaryLight
                            )
                        }
                    }

                    Switch(
                        checked = state.isAvailableForWork,
                        onCheckedChange = viewModel::toggleAvailability,
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Emerald600,
                            checkedTrackColor = Emerald100.copy(alpha = 0.8f)
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // 5 Key Metric Cards (Row 1: 2 items, Row 2: 3 items)
            Text(
                text = "خلاصه فعالیت و عملکرد شما",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = stringResource(id = R.string.stat_nearby_jobs),
                    value = "${PersianDateFormatter.toPersianDigits(state.nearbyJobsCount)} مورد",
                    icon = Icons.Default.NearMe,
                    iconTint = Blue500,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToJobs
                )
                StatCard(
                    title = stringResource(id = R.string.stat_active_shifts),
                    value = "${PersianDateFormatter.toPersianDigits(state.activeShiftsCount)} شیفت",
                    icon = Icons.Default.DateRange,
                    iconTint = Emerald600,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToShifts
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = stringResource(id = R.string.stat_my_applications),
                    value = "${PersianDateFormatter.toPersianDigits(state.applicationsCount)} کار",
                    icon = Icons.Default.Assignment,
                    iconTint = Purple500,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToApplications
                )
                StatCard(
                    title = stringResource(id = R.string.stat_earnings),
                    value = PriceFormatter.formatToman(state.monthlyEarningsToman),
                    icon = Icons.Default.AttachMoney,
                    iconTint = Emerald600,
                    modifier = Modifier.weight(1.3f)
                )
                StatCard(
                    title = stringResource(id = R.string.stat_rating),
                    value = PersianDateFormatter.toPersianDigits(state.performanceRating),
                    icon = Icons.Default.Star,
                    iconTint = Amber500,
                    modifier = Modifier.weight(0.9f)
                )
            }

            Spacer(modifier = Modifier.height(22.dp))

            // AI Smart Recommended Jobs Section
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = null,
                        tint = Emerald600,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "پیشنهادات هوشمند منطبق با تخصص شما",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }

                TextButton(onClick = onNavigateToJobs) {
                    Text(
                        text = stringResource(id = R.string.view_all),
                        style = MaterialTheme.typography.labelLarge,
                        color = Emerald600
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            state.recommendedJobs.forEach { job ->
                JobCard(
                    job = job,
                    onClick = { onNavigateToJobDetails(job.id) },
                    onApplyClick = { viewModel.applyForJob(job.id) }
                )
                Spacer(modifier = Modifier.height(10.dp))
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Urgent Jobs Section
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Whatshot,
                        contentDescription = null,
                        tint = Red500,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = stringResource(id = R.string.urgent_jobs_title),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            state.urgentJobs.take(3).forEach { job ->
                JobCard(
                    job = job,
                    onClick = { onNavigateToJobDetails(job.id) },
                    onApplyClick = { viewModel.applyForJob(job.id) }
                )
                Spacer(modifier = Modifier.height(10.dp))
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

package com.karvin.app.presentation.worker.jobs

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.KarvinSkillBadge
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy100
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter
import com.karvin.app.utils.PriceFormatter

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun JobDetailsScreen(
    jobId: String,
    onNavigateBack: () -> Unit,
    viewModel: WorkerJobsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val scroll = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(jobId) {
        viewModel.loadJobDetails(jobId)
    }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    val job = state.selectedJob

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.job_details_title),
                onBackClick = onNavigateBack
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            if (job != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surface)
                        .padding(16.dp)
                ) {
                    if (job.hasApplied) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Emerald100),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald600, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "درخواست شما برای این آگهی ثبت شده است", style = MaterialTheme.typography.labelLarge, color = Emerald600, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        KarvinButton(
                            text = stringResource(id = R.string.apply_for_job),
                            onClick = { viewModel.applyForJob(job.id) },
                            type = KarvinButtonType.SECONDARY
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        if (job != null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp)
                    .verticalScroll(scroll)
            ) {
                Spacer(modifier = Modifier.height(12.dp))

                // Title & Category
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(Navy100)
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text(text = job.categoryName, style = MaterialTheme.typography.labelMedium, color = Navy900, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(text = job.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)

                Spacer(modifier = Modifier.height(16.dp))

                // Salary Card Banner
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Emerald100.copy(alpha = 0.5f))
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = stringResource(id = R.string.salary_label), style = MaterialTheme.typography.bodySmall, color = TextSecondaryLight)
                            Text(text = PriceFormatter.formatToman(job.salaryToman), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = Emerald600)
                        }
                        Text(text = if (job.isHourlySalary) "ساعتی" else "روزانه", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = Emerald600)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Key Parameters Card
                KarvinCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Navy900, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(text = "تاریخ کار: ${PersianDateFormatter.toPersianDigits(job.date)}", style = MaterialTheme.typography.bodyMedium)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AccessTime, contentDescription = null, tint = Navy900, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(text = "ساعت کاری: ${PersianDateFormatter.toPersianDigits(job.startTime)} تا ${PersianDateFormatter.toPersianDigits(job.endTime)}", style = MaterialTheme.typography.bodyMedium)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.People, contentDescription = null, tint = Navy900, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(text = "تعداد نیروی مورد نیاز: ${PersianDateFormatter.toPersianDigits(job.numberOfWorkersNeeded)} نفر", style = MaterialTheme.typography.bodyMedium)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = Navy900, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(text = "${job.city}، ${job.address}", style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Job Description
                Text(text = "شرح وظایف و جزئیات کار:", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = job.description, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface, lineHeight = MaterialTheme.typography.bodyLarge.lineHeight)

                Spacer(modifier = Modifier.height(16.dp))

                // Required Skills
                if (job.requiredSkills.isNotEmpty()) {
                    Text(text = stringResource(id = R.string.required_skills_label), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        job.requiredSkills.forEach { skill ->
                            KarvinSkillBadge(text = skill, isHighlighted = true)
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Employer Profile Card
                Text(text = stringResource(id = R.string.employer_info_label), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                KarvinCard(modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(44.dp).clip(CircleShape).background(Navy900), contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Business, contentDescription = null, tint = androidx.compose.ui.graphics.Color.White, modifier = Modifier.size(24.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(text = job.businessName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(text = job.employerName, style = MaterialTheme.typography.bodySmall, color = TextSecondaryLight)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

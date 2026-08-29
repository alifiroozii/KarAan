package com.karvin.app.feature.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.NotificationsNone
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.Avatar
import com.karvin.app.core.designsystem.CategoryChip
import com.karvin.app.core.designsystem.EmptyState
import com.karvin.app.core.designsystem.ErrorState
import com.karvin.app.core.designsystem.JobCard
import com.karvin.app.core.designsystem.KarvinFab
import com.karvin.app.core.designsystem.KarvinScaffold
import com.karvin.app.core.designsystem.LoadingState
import com.karvin.app.core.designsystem.RatingLine
import com.karvin.app.core.navigation.Routes
import com.karvin.app.data.FakeData
import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.toPersianDigits
import com.karvin.app.domain.usecase.toCompactPrice

@Composable
fun WorkerHomeScreen(navController: NavHostController, viewModel: WorkerHomeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val openRequests = state.jobs.count { it.status == JobStatus.OPEN }
    val inProgress = state.jobs.count { it.status == JobStatus.IN_PROGRESS || it.status == JobStatus.ACCEPTED }
    KarvinScaffold(navController, UserRole.WORKER, content = { padding ->
        LazyColumn(Modifier.padding(padding).padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item {
                AppTopBar("خانه", actions = {
                    IconButton(onClick = { navController.navigate(Routes.Notifications) }) { Icon(Icons.Default.NotificationsNone, "اعلان‌ها") }
                    IconButton(onClick = { navController.navigate(Routes.Profile) }) { Icon(Icons.Default.Person, "پروفایل") }
                })
            }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text("سلام ${state.user.name.substringBefore(' ')} 👋", style = MaterialTheme.typography.headlineSmall)
                    Text("درخواست‌های نزدیک را ببین و اعلام آمادگی کن.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            item {
                // آنلاین هستم — طرح صفحه ۱ مسیر ارائه‌دهنده
                Card(colors = CardDefaults.cardColors(containerColor = if (state.isAvailable) com.karvin.app.core.designsystem.OnlineGreen.copy(alpha = .14f) else MaterialTheme.colorScheme.surfaceVariant), shape = RoundedCornerShape(18.dp)) {
                    Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                            Text(if (state.isAvailable) "آنلاین هستم" else "آفلاین هستید", style = MaterialTheme.typography.titleMedium, color = if (state.isAvailable) com.karvin.app.core.designsystem.OnlineGreenDark else MaterialTheme.colorScheme.onSurface)
                            Text(if (state.isAvailable) "درخواست‌دهنده‌ها می‌توانند شما را ببینند." else "برای دریافت درخواست‌های نزدیک، وضعیتت را فعال کن.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Switch(checked = state.isAvailable, onCheckedChange = { viewModel.onEvent(WorkerHomeEvent.ToggleAvailability(it)) }, colors = SwitchDefaults.colors(checkedTrackColor = com.karvin.app.core.designsystem.OnlineGreen), modifier = Modifier.semantics { contentDescription = "وضعیت آنلاین" })
                    }
                }
            }
            item {
                // محدوده فعالیت — آمار درخواست‌ها
                Card(onClick = { navController.navigate(Routes.WorkArea) }, colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer), shape = RoundedCornerShape(18.dp)) {
                    Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text("محدوده فعالیت", style = MaterialTheme.typography.titleMedium)
                                Text("برای تغییر شعاع دریافت درخواست لمس کنید.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text("‹", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary)
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            StatBox(openRequests, "درخواست جدید", Modifier.weight(1f))
                            StatBox(inProgress, "در حال انجام", Modifier.weight(1f))
                        }
                    }
                }
            }
            item {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text("درخواست‌های نزدیک", style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
                    TextButton(onClick = { navController.navigate(Routes.WorkerJobs) }) { Text("مشاهده همه", color = MaterialTheme.colorScheme.primary) }
                }
            }
            when {
                state.loading -> item { LoadingState() }
                state.error != null -> item { ErrorState(state.error.orEmpty()) { viewModel.onEvent(WorkerHomeEvent.Retry) } }
                state.jobs.none { it.status == JobStatus.OPEN } -> item { EmptyState("درخواست نزدیکی نیست", "فعلاً درخواست جدیدی در محدوده شما ثبت نشده است.") }
                else -> items(state.jobs.filter { it.status == JobStatus.OPEN }.take(5), key = { it.id }) { job -> NearbyRequestRow(job, DefaultHomePoint) { navController.navigate(Routes.jobDetails(job.id)) } }
            }
            item { Spacer(Modifier.height(84.dp)) }
        }
    })
}

@Composable
private fun StatBox(value: Int, label: String, modifier: Modifier) {
    Card(modifier, shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value.toString().toPersianDigits(), style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun NearbyRequestRow(job: Job, userPoint: com.karvin.app.domain.model.GeoPoint, onClick: () -> Unit) {
    Card(onClick = onClick, shape = RoundedCornerShape(14.dp)) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Surface(shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.primaryContainer) {
                Text(job.category.title.take(1), Modifier.padding(10.dp), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(job.title, style = MaterialTheme.typography.titleMedium)
                Text(job.category.title, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(job.amount.toCompactPrice() + " ریال", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                Text(DistanceCalculator.format(DistanceCalculator.distanceInKm(userPoint, job.point)), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
fun EmployerHomeScreen(navController: NavHostController, viewModel: EmployerHomeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val active = state.myJobs.count { it.status == JobStatus.OPEN }
    val candidates = state.myJobs.sumOf { it.applicantCount }
    val inProgress = state.myJobs.count { it.status == JobStatus.IN_PROGRESS }
    val completed = state.myJobs.count { it.status == JobStatus.COMPLETED || it.status == JobStatus.RATED }
    KarvinScaffold(navController, UserRole.EMPLOYER, content = { padding ->
        LazyColumn(Modifier.padding(padding).padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item { AppTopBar("خانه", actions = { IconButton(onClick = { navController.navigate(Routes.Notifications) }) { Icon(Icons.Default.NotificationsNone, "اعلان‌ها") }; IconButton(onClick = { navController.navigate(Routes.Profile) }) { Icon(Icons.Default.Person, "پروفایل") } }) }
            item { Column(verticalArrangement = Arrangement.spacedBy(5.dp)) { Text("سلام ${state.user.name.substringBefore(' ')} 👋", style = MaterialTheme.typography.headlineSmall); Text("به متخصص مورد نظرت نزدیک شو.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) } }
            item { Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary), shape = RoundedCornerShape(20.dp), onClick = { navController.navigate(Routes.CreateJob) }) { Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) { Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) { Text("به متخصص نیاز داری؟", color = Color.White, style = MaterialTheme.typography.titleLarge); Text("درخواست خدمت جدید را در کمتر از یک دقیقه ثبت کن.", color = Color.White.copy(alpha = .82f), style = MaterialTheme.typography.bodyMedium) }; Text("+", color = Color.White, style = MaterialTheme.typography.displaySmall) } } }
            item { DashboardMetrics(active, candidates, inProgress, completed) }
            item { Text("درخواست‌های اخیر", style = MaterialTheme.typography.titleLarge) }
            when { state.loading -> item { LoadingState() }; state.error != null -> item { ErrorState(state.error.orEmpty()) { viewModel.reload() } }; state.myJobs.isEmpty() -> item { EmptyState("هنوز درخواستی ثبت نکرده‌اید", "اولین درخواست خدمت خود را ثبت کنید.", { navController.navigate(Routes.CreateJob) }, "ثبت درخواست") }; else -> items(state.myJobs.take(5), key = { it.id }) { job -> JobCard(job, DefaultHomePoint, { navController.navigate(Routes.jobDetails(job.id, employerMode = true)) }, {}, showSave = false) } }
            item { Spacer(Modifier.height(84.dp)) }
        }
    }, floatingActionButton = { KarvinFab("ثبت درخواست خدمت") { navController.navigate(Routes.CreateJob) } })
}

@Composable
private fun DashboardMetrics(active: Int, applicants: Int, inProgress: Int, completed: Int) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Metric("فعال", active, Modifier.weight(1f))
        Metric("متقاضی", applicants, Modifier.weight(1f))
        Metric("در حال انجام", inProgress, Modifier.weight(1f))
        Metric("تمام‌شده", completed, Modifier.weight(1f))
    }
}

@Composable
private fun Metric(label: String, value: Int, modifier: Modifier) {
    Card(modifier, shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) { Column(Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(value.toString().toPersianDigits(), style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary); Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) } }
}

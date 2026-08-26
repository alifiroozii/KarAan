package com.karvin.app.feature.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.NotificationsNone
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.usecase.toCompactPrice
import com.karvin.app.domain.model.toPersianDigits

@Composable
fun WorkerHomeScreen(navController: NavHostController, viewModel: WorkerHomeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
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
                    Text("امروز چه کاری برایت مناسب است؟", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            item {
                Card(colors = CardDefaults.cardColors(containerColor = if (state.isAvailable) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant), shape = androidx.compose.foundation.shape.RoundedCornerShape(18.dp)) {
                    Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                            Text(if (state.isAvailable) "آماده به کار هستی" else "الان آماده به کار نیستی", style = MaterialTheme.typography.titleMedium)
                            Text(if (state.isAvailable) "کارفرماهای اطراف می‌توانند تو را ببینند." else "برای دریافت پیشنهادهای نزدیک، وضعیتت را فعال کن.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Switch(checked = state.isAvailable, onCheckedChange = { viewModel.onEvent(com.karvin.app.feature.home.WorkerHomeEvent.ToggleAvailability(it)) }, modifier = Modifier.semantics { contentDescription = "وضعیت آماده به کار" })
                    }
                }
            }
            item {
                Text("دسته‌بندی‌های محبوب", style = MaterialTheme.typography.titleMedium)
                Row(Modifier.horizontalScroll(rememberScrollState()).padding(top = 9.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CategoryChip("همه", state.filter.categoryId == null) { viewModel.onEvent(WorkerHomeEvent.CategorySelected(null)) }
                    FakeData.categories.take(7).forEach { category -> CategoryChip(category.title, state.filter.categoryId == category.id) { viewModel.onEvent(WorkerHomeEvent.CategorySelected(category.id)) } }
                }
            }
            item {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text("کارهای نزدیک", style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
                    TextButton(onClick = { navController.navigate(Routes.WorkerJobs) }) { Text("مشاهده همه", color = MaterialTheme.colorScheme.primary) }
                }
            }
            when {
                state.loading -> item { LoadingState() }
                state.error != null -> item { ErrorState(state.error.orEmpty()) { viewModel.onEvent(WorkerHomeEvent.Retry) } }
                state.jobs.isEmpty() -> item { EmptyState("کاری پیدا نشد", "فیلترها را تغییر بده یا بعداً دوباره امتحان کن.") }
                else -> items(state.jobs.take(8), key = { it.id }) { job -> JobCard(job, DefaultHomePoint, { navController.navigate(Routes.jobDetails(job.id)) }, { viewModel.onEvent(WorkerHomeEvent.SaveJob(job.id)) }) }
            }
            item { Spacer(Modifier.height(84.dp)) }
        }
    })
}

@Composable
fun EmployerHomeScreen(navController: NavHostController, viewModel: EmployerHomeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val active = state.myJobs.count { it.status == com.karvin.app.domain.model.JobStatus.OPEN }
    val candidates = state.myJobs.sumOf { it.applicantCount }
    val inProgress = state.myJobs.count { it.status == com.karvin.app.domain.model.JobStatus.IN_PROGRESS }
    val completed = state.myJobs.count { it.status == com.karvin.app.domain.model.JobStatus.COMPLETED || it.status == com.karvin.app.domain.model.JobStatus.RATED }
    KarvinScaffold(navController, UserRole.EMPLOYER, content = { padding ->
        LazyColumn(Modifier.padding(padding).padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item { AppTopBar("خانه", actions = { IconButton(onClick = { navController.navigate(Routes.Notifications) }) { Icon(Icons.Default.NotificationsNone, "اعلان‌ها") }; IconButton(onClick = { navController.navigate(Routes.Profile) }) { Icon(Icons.Default.Person, "پروفایل") } }) }
            item { Column(verticalArrangement = Arrangement.spacedBy(5.dp)) { Text("سلام ${state.user.name.substringBefore(' ')} 👋", style = MaterialTheme.typography.headlineSmall); Text("برای شروع، نیروی مناسب را پیدا کن.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) } }
            item { Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary), shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp), onClick = { navController.navigate(Routes.CreateJob) }) { Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) { Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) { Text("برای کارت نیرو می‌خواهی؟", color = androidx.compose.ui.graphics.Color.White, style = MaterialTheme.typography.titleLarge); Text("درخواست کار جدید را در کمتر از یک دقیقه ثبت کن.", color = androidx.compose.ui.graphics.Color.White.copy(alpha = .82f), style = MaterialTheme.typography.bodyMedium) }; Text("+", color = androidx.compose.ui.graphics.Color.White, style = MaterialTheme.typography.displaySmall) } } }
            item { DashboardMetrics(active, candidates, inProgress, completed) }
            item { Text("درخواست‌های اخیر", style = MaterialTheme.typography.titleLarge) }
            when { state.loading -> item { LoadingState() }; state.error != null -> item { ErrorState(state.error.orEmpty()) { viewModel.reload() } }; state.myJobs.isEmpty() -> item { EmptyState("هنوز درخواستی ثبت نکرده‌اید", "اولین درخواست کار خود را ثبت کنید.", { navController.navigate(Routes.CreateJob) }, "ثبت درخواست") }; else -> items(state.myJobs.take(5), key = { it.id }) { job -> JobCard(job, DefaultHomePoint, { navController.navigate(Routes.jobDetails(job.id, employerMode = true)) }, {}, showSave = false) } }
            item { Spacer(Modifier.height(84.dp)) }
        }
    }, floatingActionButton = { KarvinFab("ثبت درخواست کار") { navController.navigate(Routes.CreateJob) } })
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
    Card(modifier, shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) { Column(Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(value.toString().toPersianDigits(), style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary); Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) } }
}

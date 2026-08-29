package com.karvin.app.feature.jobs

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.KarvinScaffold
import com.karvin.app.core.designsystem.CategoryChip
import com.karvin.app.core.designsystem.EmptyState
import com.karvin.app.core.designsystem.ErrorState
import com.karvin.app.core.designsystem.JobCard
import com.karvin.app.core.designsystem.LoadingState
import com.karvin.app.core.designsystem.PrimaryButton
import com.karvin.app.core.designsystem.RatingLine
import com.karvin.app.core.designsystem.Avatar
import com.karvin.app.core.designsystem.toPersianDate
import com.karvin.app.core.designsystem.toPersianTime
import com.karvin.app.core.navigation.Routes
import com.karvin.app.data.FakeData
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.CreateJobInput
import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.GenderRequirement
import com.karvin.app.domain.model.JobFilter
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.PaymentType
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.toPersianDigits
import com.karvin.app.domain.model.toRialString
import com.karvin.app.domain.usecase.label
import java.time.LocalDate
import java.time.LocalTime

@Composable
fun JobsScreen(navController: NavHostController, employerMode: Boolean, viewModel: JobsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(employerMode) { viewModel.setEmployerMode(employerMode) }
    var showFilters by remember { mutableStateOf(false) }
    com.karvin.app.core.designsystem.KarvinScaffold(
        navController,
        if (employerMode) com.karvin.app.domain.model.UserRole.EMPLOYER else com.karvin.app.domain.model.UserRole.WORKER,
        content = { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
        AppTopBar(if (employerMode) "درخواست‌های من" else "درخواست‌های نزدیک", onBack = { navController.popBackStack() }, actions = {
            if (!employerMode) IconButton(onClick = { showFilters = true }, modifier = Modifier.semantics { contentDescription = "فیلترها" }) { Icon(Icons.Default.FilterList, "فیلترها") }
        })
        if (!employerMode) {
            OutlinedTextField(
                value = state.filter.query,
                onValueChange = { viewModel.updateFilter(state.filter.copy(query = it)) },
                label = { Text("جستجو در عنوان یا دسته‌بندی") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
            )
            Row(Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DistanceFilter.values().forEach { filter ->
                    FilterChip(selected = state.filter.distance == filter, onClick = { viewModel.updateFilter(state.filter.copy(distance = filter)) }, label = { Text(filter.label()) })
                }
            }
        }
        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error.orEmpty()) { viewModel.updateFilter(state.filter) }
            state.jobs.isEmpty() -> EmptyState("نتیجه‌ای پیدا نشد", "عبارت جستجو یا فیلتر فاصله را تغییر دهید.")
            else -> LazyColumn(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.jobs, key = { it.id }) { job -> JobCard(job, FakeData.center, { navController.navigate(Routes.jobDetails(job.id, employerMode)) }, { viewModel.toggleSave(job.id) }, showSave = !employerMode) }
                item { Spacer(Modifier.height(22.dp)) }
            }
        }
        }
    })
    if (showFilters) {
        FilterDialog(state.filter, { next -> showFilters = false; viewModel.updateFilter(next) }, { showFilters = false })
    }
}

@Composable
private fun FilterDialog(filter: JobFilter, onApply: (JobFilter) -> Unit, onDismiss: () -> Unit) {
    var urgent by remember(filter.urgentOnly) { mutableStateOf(filter.urgentOnly) }
    var minimumRating by remember(filter.minimumRating) { mutableStateOf(filter.minimumRating ?: 0.0) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("فیلتر درخواست‌ها") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("حداقل امتیاز درخواست‌دهنده: ${if (minimumRating == 0.0) "همه" else minimumRating.toString().toPersianDigits()}")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf(0.0, 4.0, 4.5).forEach { value -> FilterChip(selected = minimumRating == value, onClick = { minimumRating = value }, label = { Text(if (value == 0.0) "همه" else "بیشتر از ${value.toString().toPersianDigits()}") }) } }
                FilterChip(selected = urgent, onClick = { urgent = !urgent }, label = { Text("فقط فوری") })
            }
        },
        confirmButton = { Button(onClick = { onApply(filter.copy(urgentOnly = urgent, minimumRating = minimumRating.takeIf { it > 0 })) }) { Text("اعمال") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("انصراف") } },
    )
}

@Composable
fun MyApplicationsScreen(navController: NavHostController, viewModel: MyApplicationsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    KarvinScaffold(navController, UserRole.EMPLOYER, content = { padding ->
    Column(Modifier.fillMaxSize().padding(padding)) {
        AppTopBar("درخواست‌های من", onBack = { navController.popBackStack() })
        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error.orEmpty()) { viewModel.reload() }
            state.applications.isEmpty() -> EmptyState("هنوز درخواستی ارسال نکرده‌اید", "از صفحه درخواست‌ها یک مورد مناسب انتخاب کنید.")
            else -> LazyColumn(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.applications, key = { it.id }) { application ->
                    Card(onClick = { navController.navigate(Routes.jobDetails(application.jobId)) }, modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)) {
                        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(FakeData.jobs.firstOrNull { it.id == application.jobId }?.title ?: "درخواست خدمت", style = MaterialTheme.typography.titleMedium)
                                Text(application.message.ifBlank { "بدون توضیح" }, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            StatusPill(application.status.name)
                        }
                    }
                }
            }
        }
    }
    })
}

@Composable
fun JobDetailsScreen(navController: NavHostController, jobId: String, employerMode: Boolean = false, viewModel: JobDetailsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var showApply by remember { mutableStateOf(false) }
    LaunchedEffect(jobId) { viewModel.load(jobId) }
    Column(Modifier.fillMaxSize()) {
        AppTopBar("جزئیات درخواست", onBack = { navController.popBackStack() }, actions = {
            IconButton(onClick = { viewModel.toggleSave() }) { Icon(Icons.Default.Save, "ذخیره") }
        })
        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error.orEmpty()) { viewModel.load(jobId) }
            state.job == null -> EmptyState("درخواست پیدا نشد", "این درخواست دیگر در دسترس نیست.")
            else -> {
                val job = state.job!!
                LazyColumn(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    item {
                        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer), shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp)) {
                            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(verticalAlignment = Alignment.Top) { Column(Modifier.weight(1f)) { Text(job.title, style = MaterialTheme.typography.headlineSmall); Text(job.category.title, color = MaterialTheme.colorScheme.primary) }; if (job.isUrgent) StatusPill("فوری") }
                                Text(job.amount.toRialString(), style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
                                Text("${job.date.toPersianDate()} · ${job.startTime.toPersianTime()} · ${job.durationHours.toString().toPersianDigits()} ساعت", style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                    item { InfoRow("محل انجام", job.address); InfoRow("فاصله", DistanceCalculator.format(DistanceCalculator.distanceInKm(FakeData.center, job.point))); InfoRow("نوع پرداخت", job.paymentType.label()) }
                    item { Text("درباره درخواست", style = MaterialTheme.typography.titleLarge); Text(job.description, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    item { Text("مهارت‌های مورد نیاز", style = MaterialTheme.typography.titleLarge); Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) { job.requiredSkills.forEach { CategoryChip(it, true) {} } } }
                    item { EmployerSummary(job) }
                    if (job.status != JobStatus.OPEN && job.status != JobStatus.CANCELLED) {
                        item { WorkflowCard(job.status, onAdvance = { viewModel.advance(job.id, job.status) }, onRate = { navController.navigate(Routes.rating(job.employer.id)) }) }
                    }
                    item {
                        if (employerMode) {
                            Button(onClick = { navController.navigate(Routes.applications(job.id)) }, modifier = Modifier.fillMaxWidth()) {
                                Text("مشاهده متقاضیان${if (job.applicantCount > 0) " (${job.applicantCount.toPersianDigits()})" else ""}")
                            }
                        } else if (state.applicationSent) {
                            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer), shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp)) { Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Check, "ارسال شد"); Spacer(Modifier.width(8.dp));                                Text("آمادگی شما برای این درخواست ثبت شد.") } }                        } else if (job.status == JobStatus.OPEN) {
                            PrimaryButton("اعلام آمادگی", { showApply = true }, Modifier.fillMaxWidth())
                        } else {
                            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant), shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp)) {
                                Text("این درخواست در حال حاضر پذیرش جدید ندارد.", Modifier.padding(16.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                    }
                    item { Spacer(Modifier.height(20.dp)) }
                }
            }
        }
    }
    if (showApply) ApplyDialog(onDismiss = { showApply = false }, onApply = { message -> showApply = false; viewModel.apply(message) })
}

@Composable
private fun ApplyDialog(onDismiss: () -> Unit, onApply: (String) -> Unit) {
    var message by remember { mutableStateOf("") }
    AlertDialog(onDismissRequest = onDismiss, title = { Text("اعلام آمادگی") }, text = { OutlinedTextField(message, { message = it }, label = { Text("پیام برای درخواست‌دهنده (اختیاری)") }, minLines = 3) }, confirmButton = { Button(onClick = { onApply(message) }) { Text("ارسال") } }, dismissButton = { TextButton(onClick = onDismiss) { Text("انصراف") } })
}

@Composable
private fun EmployerSummary(job: com.karvin.app.domain.model.Job) {
    Card(shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)) { Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Avatar(job.employer, size = 48.dp); Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) {                Text("کاربر ${job.employer.name}", style = MaterialTheme.typography.titleMedium); Text("درخواست‌دهنده · ${job.employer.completedJobs.toString().toPersianDigits()} درخواست ثبت‌شده", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; RatingLine(job.employer.rating, job.employer.reviewCount) } }
}

@Composable
private fun InfoRow(label: String, value: String) { Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f)); Text(value, style = MaterialTheme.typography.titleMedium) } }

@Composable
private fun StatusPill(status: String) { Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer), shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp)) { Text(status.replace("PENDING", "در انتظار").replace("ACCEPTED", "پذیرفته").replace("REJECTED", "رد شده"), modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp), style = MaterialTheme.typography.labelSmall) } }

@Composable
private fun WorkflowCard(status: JobStatus, onAdvance: () -> Unit, onRate: () -> Unit) {
    Card(shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("وضعیت همکاری", style = MaterialTheme.typography.titleMedium)
            Text(status.label(), color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.titleLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (status == JobStatus.COMPLETED) Button(onClick = onRate, modifier = Modifier.weight(1f)) { Text("ثبت امتیاز") }
                else if (status != JobStatus.RATED) Button(onClick = onAdvance, modifier = Modifier.weight(1f)) { Text("مرحله بعد") }
            }
        }
    }
}

@Composable
fun JobApplicationsScreen(navController: NavHostController, jobId: String, viewModel: JobApplicationsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(jobId) { viewModel.load(jobId) }
    Column(Modifier.fillMaxSize()) {
        AppTopBar("متقاضیان درخواست", onBack = { navController.popBackStack() })
        when { state.loading -> LoadingState(); state.error != null -> ErrorState(state.error.orEmpty()) { viewModel.load(jobId) }; state.applications.isEmpty() -> EmptyState("هنوز متقاضی ندارید", "وقتی کسی درخواست بفرستد اینجا نمایش داده می‌شود."); else -> LazyColumn(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { items(state.applications, key = { it.id }) { application -> ApplicantCard(application, onAccept = { viewModel.accept(application.id) }, onProfile = { navController.navigate(Routes.workerDetails(application.worker.id)) }) } } }
    }
}

@Composable
private fun ApplicantCard(application: com.karvin.app.domain.model.Application, onAccept: () -> Unit, onProfile: () -> Unit) {
    Card(shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Avatar(application.worker, size = 48.dp); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f)) { Text(application.worker.name, style = MaterialTheme.typography.titleMedium); RatingLine(application.worker.rating, application.worker.reviewCount) }; StatusPill(application.status.name) }; Text(application.message, color = MaterialTheme.colorScheme.onSurfaceVariant); Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { OutlinedButton(onClick = onProfile, modifier = Modifier.weight(1f)) { Text("پروفایل") }; Button(onClick = onAccept, modifier = Modifier.weight(1f), enabled = application.status == ApplicationStatus.PENDING) {Text("انتخاب متخصص") } } }
 }
}

@Composable
fun CreateJobScreen(navController: NavHostController, workerId: String? = null, viewModel: CreateJobViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(state.published?.id, workerId) {
        val publishedId = state.published?.id
        if (publishedId != null && !workerId.isNullOrBlank()) viewModel.inviteWorker(workerId, publishedId)
    }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("تهران، بلوار کشاورز") }
    var workers by remember { mutableStateOf("۱") }
    var selectedCategory by remember { mutableStateOf(FakeData.categories.first()) }
    var urgent by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize()) {
        AppTopBar("ثبت درخواست خدمت", onBack = { navController.popBackStack() })
        LazyColumn(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { Text(if (workerId.isNullOrBlank()) "جزئیات درخواست را وارد کنید" else "جزئیات درخواست برای متخصص منتخب را وارد کنید", style = MaterialTheme.typography.titleLarge) }
            item { OutlinedTextField(title, { title = it }, label = { Text("عنوان درخواست") }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
            item { Text("دسته‌بندی", style = MaterialTheme.typography.titleMedium) }
            item { Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) { FakeData.categories.take(8).forEach { CategoryChip(it.title, it.id == selectedCategory.id) { selectedCategory = it } } } }
            item { OutlinedTextField(description, { description = it }, label = { Text("توضیحات") }, modifier = Modifier.fillMaxWidth(), minLines = 4) }
            item { Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { OutlinedTextField(amount, { amount = it.filter(Char::isDigit) }, label = { Text("مبلغ (ریال)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.weight(1f), singleLine = true); OutlinedTextField(workers, { workers = it.filter(Char::isDigit) }, label = { Text("تعداد مراجعه") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.width(125.dp), singleLine = true) } }
            item { OutlinedTextField(address, { address = it }, label = { Text("محل ارائه خدمت") }, leadingIcon = { Icon(Icons.Default.LocationOn, null) }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
            item { FilterChip(selected = urgent, onClick = { urgent = !urgent }, label = { Text("این درخواست فوری است") }) }
            item { Text("محل روی نقشه در نسخه backend با انتخاب دقیق مختصات ذخیره می‌شود.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            item { PrimaryButton("انتشار درخواست", { val parsedAmount = amount.toLongOrNull() ?: 0L; if (title.isNotBlank() && parsedAmount > 0) viewModel.publish(CreateJobInput(title, selectedCategory, description.ifBlank { "توضیحات تکمیلی پس از هماهنگی اعلام می‌شود." }, workers.toIntOrNull() ?: 1, GenderRequirement.ANY, LocalDate.now(), LocalTime.of(16, 0), 4.0, parsedAmount, PaymentType.CASH, address, FakeData.center, urgent, listOf(selectedCategory.title))); }, Modifier.fillMaxWidth(), enabled = !state.loading) }
            if (state.error != null) item { Text(state.error.orEmpty(), color = MaterialTheme.colorScheme.error) }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
    if (state.published != null) {
        AlertDialog(onDismissRequest = { navController.navigate(Routes.EmployerHome) { popUpTo(Routes.CreateJob) { inclusive = true } } }, title = { Text("درخواست منتشر شد") }, text = { Text("درخواست شما با موفقیت منتشر شد و برای متخصص‌های اطراف قابل مشاهده است.") }, confirmButton = { Button(onClick = { navController.navigate(Routes.EmployerHome) { popUpTo(Routes.CreateJob) { inclusive = true } } }) { Text("بازگشت به خانه") } })
    }
}

private fun PaymentType.label(): String = when (this) { PaymentType.CASH -> "نقدی"; PaymentType.CARD -> "کارت به کارت"; PaymentType.WALLET -> "کیف پول" }

package com.karvin.app.feature.map

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Adjust
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FilterAlt
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.CameraPositionState
import com.google.maps.android.compose.Circle
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.MapProperties
import com.google.maps.android.compose.MapUiSettings
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.karvin.app.core.designsystem.Avatar
import com.karvin.app.core.designsystem.JobCard
import com.karvin.app.core.designsystem.OnlinePill
import com.karvin.app.core.designsystem.PrimaryButton
import com.karvin.app.core.designsystem.RatingLine
import com.karvin.app.core.designsystem.WorkerCard
import com.karvin.app.core.designsystem.toPersianDate
import com.karvin.app.core.designsystem.toPersianTime
import com.karvin.app.core.location.LocationResult
import com.karvin.app.core.location.LocationTracker
import com.karvin.app.core.navigation.Routes
import com.karvin.app.data.FakeData
import com.karvin.app.domain.model.Category
import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.WorkerFilter
import com.karvin.app.domain.model.toPersianDigits
import com.karvin.app.domain.model.toRialString
import com.karvin.app.domain.usecase.label
import com.karvin.app.feature.home.DefaultHomePoint
import com.karvin.app.feature.workers.WorkersViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class MapLocationViewModel @Inject constructor(private val tracker: LocationTracker) : ViewModel() {
    val state: StateFlow<com.karvin.app.domain.model.LocationState> = tracker.state
    private val _point = MutableStateFlow(DefaultHomePoint)
    val point: StateFlow<GeoPoint> = _point.asStateFlow()
    fun refresh() { tracker.refresh { result -> if (result is LocationResult.Available) _point.value = result.point } }
}

/** نقشه درخواست‌های نزدیک (مسیر ارائه‌دهنده) — طرح صفحه ۲ و ۳. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen(navController: NavHostController, workerMode: Boolean = true, viewModel: MapLocationViewModel = hiltViewModel()) {
    val userPoint by viewModel.point.collectAsStateWithLifecycle()
    var explanation by remember { mutableStateOf(true) }
    var permissionDialog by remember { mutableStateOf(false) }
    var selectedJob by remember { mutableStateOf<Job?>(null) }
    var query by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<Category?>(null) }
    var distance by remember { mutableStateOf(DistanceFilter.UNDER_TEN) }
    var listMode by remember { mutableStateOf(false) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { viewModel.refresh() }
    LaunchedEffect(Unit) { viewModel.refresh() }
    val jobs = remember(query, distance, selectedCategory, userPoint) {
        val selected = selectedCategory
        FakeData.jobs.filter { job ->
            val matches = query.isBlank() || job.title.contains(query) || job.category.title.contains(query)
            matches && (selected == null || job.category.id == selected.id) &&
                DistanceCalculator.matches(DistanceCalculator.distanceInKm(userPoint, job.point), distance)
        }
    }
    Box(Modifier.fillMaxSize()) {
        if (listMode) {
            LazyColumn(Modifier.fillMaxSize().background(Color(0xFFF5F4F9)).padding(top = 128.dp, start = 16.dp, end = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(jobs, key = { it.id }) { JobCard(it, userPoint, { selectedJob = it }, {}, showSave = false) }
            }
        } else {
            RealJobMap(jobs, userPoint) { selectedJob = it }
        }
        Column(Modifier.fillMaxWidth().padding(top = 22.dp, start = 16.dp, end = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.popBackStack() }, modifier = Modifier.clip(CircleShape).background(MaterialTheme.colorScheme.surface)) { Text("‹", style = MaterialTheme.typography.headlineSmall) }
                OutlinedTextField(query, { query = it }, modifier = Modifier.weight(1f), placeholder = { Text("جستجو در درخواست‌ها") }, singleLine = true, leadingIcon = { Icon(Icons.Default.Search, null) }, shape = RoundedCornerShape(16.dp))
                IconButton(onClick = { permissionDialog = true }, modifier = Modifier.clip(CircleShape).background(MaterialTheme.colorScheme.surface).semantics { contentDescription = "موقعیت من" }) { Icon(Icons.Default.MyLocation, null) }
            }
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = selectedCategory == null, onClick = { selectedCategory = null }, label = { Text("همه") })
                FakeData.categories.take(4).forEach { category -> FilterChip(selected = selectedCategory?.id == category.id, onClick = { selectedCategory = category }, label = { Text(category.title) }) }
            }
        }
        Column(Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DistanceFilter.values().filter { it != DistanceFilter.ALL }.forEach { filter -> FilterChip(selected = distance == filter, onClick = { distance = filter }, label = { Text(filter.label) }) }
            }
            SingleChoiceSegmentedButtonRow(Modifier.align(Alignment.Start)) {
                listOf("نقشه", "لیست").forEachIndexed { index, title -> SegmentedButton(selected = listMode == (index == 1), onClick = { listMode = index == 1 }, shape = SegmentedButtonDefaults.itemShape(index, 2), icon = {}) { Text(title) } }
            }
        }
    }
    if (explanation) LocationExplanation(onContinue = { explanation = false; launcher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) }, onDemo = { explanation = false }, onLater = { explanation = false })
    if (permissionDialog) AlertDialog(onDismissRequest = { permissionDialog = false }, title = { Text("دسترسی موقعیت مکانی") }, text = { Text("برای نمایش درخواست‌های نزدیک، موقعیت تقریبی یا دقیق شما کافی است.") }, confirmButton = { Button(onClick = { permissionDialog = false; launcher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) }) { Text("فعال کردن موقعیت") } }, dismissButton = { TextButton(onClick = { permissionDialog = false }) { Text("حالت نمایشی") } })
    selectedJob?.let { job ->
        ModalBottomSheet(onDismissRequest = { selectedJob = null }, shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)) {
            JobRequestSheet(job, userPoint, onAccept = { selectedJob = null; navController.navigate(Routes.requestSent(provider = true)) })
        }
    }
}

/** جزئیات درخواست (پذیرش) — طرح صفحه ۳ مسیر ارائه‌دهنده. */
@Composable
private fun JobRequestSheet(job: Job, userPoint: GeoPoint, onAccept: () -> Unit) {
    Column(Modifier.padding(horizontal = 22.dp).padding(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Surface(color = MaterialTheme.colorScheme.primaryContainer, shape = RoundedCornerShape(12.dp)) {
                Icon(Icons.Default.LocationOn, null, Modifier.padding(10.dp), tint = MaterialTheme.colorScheme.primary)
            }
            Column(Modifier.weight(1f)) {
                Text(job.title, style = MaterialTheme.typography.headlineSmall)
                Text("دسته‌بندی: ${job.category.title}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        SheetInfoRow(Icons.Default.Payments, "بودجه پیشنهادی", job.amount.toRialString())
        SheetInfoRow(Icons.Default.LocationOn, "فاصله", DistanceCalculator.format(DistanceCalculator.distanceInKm(userPoint, job.point)))
        val dayLabel = if (job.date == LocalDate.now()) "امروز" else job.date.toPersianDate()
        SheetInfoRow(Icons.Default.Schedule, "زمان", "$dayLabel، بعد از ساعت ${job.startTime.toPersianTime()}")
        Text("توضیحات", style = MaterialTheme.typography.titleMedium)
        Text(job.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Avatar(job.employer, size = 42.dp)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text("کاربر ${job.employer.name}", style = MaterialTheme.typography.titleMedium)
                RatingLine(job.employer.rating)
            }
        }
        if (job.status == com.karvin.app.domain.model.JobStatus.OPEN) {
            Button(onClick = onAccept, modifier = Modifier.fillMaxWidth().height(52.dp), shape = RoundedCornerShape(14.dp), colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)) {
                Text("اعلام آمادگی", color = MaterialTheme.colorScheme.onSecondary)
            }
        } else {
            Card(shape = RoundedCornerShape(14.dp), colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                Text("وضعیت: ${job.status.label()}", Modifier.fillMaxWidth().padding(14.dp), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        TextButton(onClick = onAccept, modifier = Modifier.fillMaxWidth()) { Text("بستن") }
    }
}

@Composable
private fun SheetInfoRow(icon: ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.titleMedium)
    }
}

/** نقشه متخصص‌ها (مسیر متقاضی خدمت) — طرح صفحات ۳ تا ۸. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkersMapScreen(navController: NavHostController, viewModel: WorkersViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var explanation by remember { mutableStateOf(true) }
    var radiusMode by remember { mutableStateOf(false) }
    var listMode by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<User?>(null) }
    var showFilters by remember { mutableStateOf(false) }
    val filter = state.filter
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { }
    val filtersActive = filter.distance != DistanceFilter.ALL || filter.minimumRating != null || filter.onlineOnly || filter.verifiedOnly || filter.service != null
    Box(Modifier.fillMaxSize()) {
        if (listMode) {
            LazyColumn(Modifier.fillMaxSize().background(Color(0xFFF5F4F9)).padding(top = 128.dp, start = 16.dp, end = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                if (state.workers.isEmpty()) item {
                    Text("متخصصی با این فیلترها پیدا نشد.", Modifier.padding(20.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                items(state.workers, key = { it.id }) { WorkerCard(it, DefaultHomePoint, { selected = it }, { viewModel.favorite(it.id) }) }
            }
        } else {
            RealWorkerMap(state.workers, radiusKm = if (radiusMode) filter.distance.maxKm else null) { selected = it }
        }
        Column(Modifier.fillMaxWidth().padding(top = 22.dp, start = 16.dp, end = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.popBackStack() }, modifier = Modifier.clip(CircleShape).background(MaterialTheme.colorScheme.surface)) { Text("‹", style = MaterialTheme.typography.headlineSmall) }
                OutlinedTextField(
                    filter.query,
                    { value -> viewModel.updateFilter(filter.copy(query = value)) },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("جستجو در متخصصین یا نام") },
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Default.Search, null) },
                    shape = RoundedCornerShape(16.dp),
                )
                IconButton(onClick = { showFilters = true }, modifier = Modifier.clip(CircleShape).background(if (filtersActive) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface).semantics { contentDescription = "فیلترهای پیشرفته" }) { Icon(Icons.Default.FilterAlt, null, tint = if (filtersActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface) }
            }
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = filter.categoryId == null, onClick = { viewModel.updateFilter(filter.copy(categoryId = null)) }, label = { Text("همه") })
                FakeData.categories.take(4).forEach { category -> FilterChip(selected = filter.categoryId == category.id, onClick = { viewModel.updateFilter(filter.copy(categoryId = category.id)) }, label = { Text(category.title) }) }
            }
        }
        Column(Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (radiusMode && !listMode) {
                Button(onClick = { radiusMode = false }, modifier = Modifier.align(Alignment.CenterHorizontally), colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text("جستجو در محدوده") }
            } else {
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("سرویس سریع", "حضور در محل", "پروژه بلندمدت").forEach { service ->
                        FilterChip(selected = filter.service == service, onClick = { viewModel.updateFilter(filter.copy(service = if (filter.service == service) null else service)) }, label = { Text(service) })
                    }
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SingleChoiceSegmentedButtonRow {
                    listOf("نقشه", "لیست").forEachIndexed { index, title -> SegmentedButton(selected = listMode == (index == 1), onClick = { listMode = index == 1 }, shape = SegmentedButtonDefaults.itemShape(index, 2), icon = {}) { Text(title) } }
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = { radiusMode = !radiusMode }, modifier = Modifier.clip(CircleShape).background(if (radiusMode) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface).semantics { contentDescription = "جستجو در شعاع محدوده" }) { Icon(Icons.Default.Adjust, null, tint = if (radiusMode) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface) }
            }
        }
    }
    if (explanation) LocationExplanation(onContinue = { explanation = false; launcher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) }, onDemo = { explanation = false }, onLater = { explanation = false })
    selected?.let { worker ->
        ModalBottomSheet(onDismissRequest = { selected = null }, shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)) {
            SpecialistSheet(
                worker = worker,
                onViewProfile = { selected = null; navController.navigate(Routes.workerDetails(worker.id)) },
                onSendRequest = { selected = null; navController.navigate(Routes.requestSent(provider = false)) },
            )
        }
    }
    if (showFilters) {
        AdvancedFiltersSheet(current = filter, onApply = { next -> viewModel.updateFilter(next); showFilters = false }, onClear = { viewModel.updateFilter(WorkerFilter(query = filter.query, categoryId = filter.categoryId)); showFilters = false }, onDismiss = { showFilters = false })
    }
}

/** جزئیات متخصص — طرح صفحه ۴. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SpecialistSheet(worker: User, onViewProfile: () -> Unit, onSendRequest: () -> Unit) {
    Column(Modifier.padding(horizontal = 22.dp).padding(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Avatar(worker, size = 64.dp)
            Column(Modifier.weight(1f)) {
                Text(worker.name, style = MaterialTheme.typography.headlineSmall)
                Text(worker.skills.firstOrNull() ?: "متخصص", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                RatingLine(worker.rating, worker.reviewCount)
            }
            OnlinePill(worker.isAvailable)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Text(worker.city, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("٪${((worker.rating / 5 * 100).toInt()).toPersianDigits()} رضایت", style = MaterialTheme.typography.bodySmall, color = Color(0xFF128A5E))
        }
        Text("خدمات ارائه شده", style = MaterialTheme.typography.titleMedium)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            worker.services.ifEmpty { worker.skills.take(2) }.forEach { service ->
                Surface(color = MaterialTheme.colorScheme.surfaceVariant, shape = RoundedCornerShape(10.dp)) {
                    Text(service, Modifier.padding(horizontal = 10.dp, vertical = 6.dp), style = MaterialTheme.typography.labelLarge)
                }
            }
        }
        OutlinedButton(onClick = onViewProfile, modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(14.dp)) { Text("مشاهده پروفایل") }
        PrimaryButton("ارسال درخواست", onSendRequest, Modifier.fillMaxWidth())
    }
}

/** فیلترهای پیشرفته — طرح صفحه ۷. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdvancedFiltersSheet(current: WorkerFilter, onApply: (WorkerFilter) -> Unit, onClear: () -> Unit, onDismiss: () -> Unit) {
    var distance by remember { mutableStateOf(current.distance) }
    var onlineOnly by remember { mutableStateOf(current.onlineOnly) }
    var verifiedOnly by remember { mutableStateOf(current.verifiedOnly) }
    var minRating by remember { mutableStateOf(current.minimumRating ?: 0.0) }
    ModalBottomSheet(onDismissRequest = onDismiss, shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)) {
        Column(Modifier.padding(horizontal = 22.dp).padding(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("فیلترها", style = MaterialTheme.typography.headlineSmall)
            Text("محدوده جستجو", style = MaterialTheme.typography.titleMedium)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DistanceFilter.values().filter { it != DistanceFilter.ALL }.forEach { option ->
                    FilterChip(selected = distance == option, onClick = { distance = option }, label = { Text(option.label) })
                }
            }
            FilterSwitchRow("فقط افراد آنلاین", onlineOnly) { onlineOnly = it }
            FilterSwitchRow("فقط افراد تایید شده", verifiedOnly) { verifiedOnly = it }
            Text("حداقل امتیاز", style = MaterialTheme.typography.titleMedium)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(0.0 to "هیچ", 3.0 to "۳+", 4.0 to "۴٫۰+", 4.5 to "۴٫۵+").forEach { (value, title) ->
                    FilterChip(selected = minRating == value, onClick = { minRating = value }, label = { Text(title) })
                }
            }
            PrimaryButton("اعمال فیلترها", { onApply(current.copy(distance = distance, onlineOnly = onlineOnly, verifiedOnly = verifiedOnly, minimumRating = minRating.takeIf { it > 0 })) }, Modifier.fillMaxWidth())
            TextButton(onClick = onClear, modifier = Modifier.fillMaxWidth()) { Text("پاک کردن فیلترها") }
        }
    }
}

@Composable
private fun FilterSwitchRow(title: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(title, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
        Switch(checked = checked, onCheckedChange = onChange, colors = SwitchDefaults.colors(checkedTrackColor = Color(0xFF17A673)))
    }
}

/** درخواست ارسال شد / آمادگی ثبت شد — طرح صفحات ۹ و ۴ مسیر ارائه‌دهنده. */
@Composable
fun RequestSentScreen(navController: NavHostController, providerMode: Boolean) {
    Column(
        Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(horizontal = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Box(Modifier.size(160.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = .55f)))
            Box(Modifier.size(124.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer), contentAlignment = Alignment.Center) {
                Icon(if (providerMode) Icons.Default.CheckCircle else Icons.AutoMirrored.Filled.Send, null, tint = if (providerMode) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary, modifier = Modifier.size(56.dp))
            }
        }
        Spacer(Modifier.height(28.dp))
        Text(if (providerMode) "آمادگی شما ثبت شد!" else "درخواست شما ارسال شد!", style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
        Spacer(Modifier.height(10.dp))
        Text(
            if (providerMode) "در صورت تایید نهایی درخواست‌دهنده، جزئیات مراجعه برای شما ارسال می‌شود."
            else "متخصص انتخابی در اولین فرصت برای هماهنگی با شما تماس خواهد گرفت.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(36.dp))
        if (!providerMode) {
            Button(onClick = { navController.navigate(Routes.EmployerJobs) { popUpTo(Routes.EmployerHome) { inclusive = false } } }, modifier = Modifier.fillMaxWidth().height(52.dp), shape = RoundedCornerShape(14.dp)) { Text("مشاهده درخواست‌ها") }
            Spacer(Modifier.height(10.dp))
        }
        Button(
            onClick = { navController.popBackStack() },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
        ) { Text("متوجه شدم", color = MaterialTheme.colorScheme.onSecondary) }
    }
}

/** دسترسی به موقعیت مکانی — طرح صفحه ۲. */
@Composable
private fun LocationExplanation(onContinue: () -> Unit, onDemo: () -> Unit, onLater: () -> Unit) {
    Dialog(onDismissRequest = onLater) {
        Surface(shape = RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surface) {
            Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(18.dp)).background(MaterialTheme.colorScheme.surfaceVariant), contentAlignment = Alignment.Center) {
                    Box(Modifier.size(68.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary.copy(alpha = .14f)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.LocationOn, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(32.dp))
                    }
                }
                Text("دسترسی به موقعیت مکانی", style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
                Text("برای یافتن متخصص‌های نزدیک با شما و نمایش آنها بر اساس موقعیت مکانی.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
                PrimaryButton("ادامه", onContinue, Modifier.fillMaxWidth())
                TextButton(onClick = onLater, modifier = Modifier.fillMaxWidth()) { Text("فعلاً نه") }
                TextButton(onClick = onDemo, modifier = Modifier.fillMaxWidth()) { Text("ادامه با حالت نمایشی", color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
        }
    }
}

@Composable
private fun RealJobMap(jobs: List<Job>, userPoint: GeoPoint, onSelect: (Job) -> Unit) {
    val camera = rememberCameraPositionState { position = CameraPosition.fromLatLngZoom(LatLng(userPoint.latitude, userPoint.longitude), 13f) }
    GoogleMap(Modifier.fillMaxSize(), cameraPositionState = camera, properties = MapProperties(isMyLocationEnabled = false), uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = false)) { jobs.forEach { job -> Marker(state = MarkerState(LatLng(job.point.latitude, job.point.longitude)), title = job.title, snippet = job.category.title, onClick = { onSelect(job); true }) } }
}

@Composable
private fun RealWorkerMap(workers: List<User>, radiusKm: Double? = null, onSelect: (User) -> Unit) {
    val camera = rememberCameraPositionState { position = CameraPosition.fromLatLngZoom(LatLng(FakeData.center.latitude, FakeData.center.longitude), 13f) }
    val primary = MaterialTheme.colorScheme.primary
    GoogleMap(Modifier.fillMaxSize(), cameraPositionState = camera, uiSettings = MapUiSettings(zoomControlsEnabled = false)) {
        if (radiusKm != null) {
            Circle(center = LatLng(FakeData.center.latitude, FakeData.center.longitude), radius = radiusKm * 1000.0, strokeColor = primary, strokeWidth = 4f, fillColor = primary.copy(alpha = 0.12f))
        }
        workers.forEach { worker -> Marker(state = MarkerState(LatLng(worker.point.latitude, worker.point.longitude)), title = worker.name, snippet = worker.skills.firstOrNull(), onClick = { onSelect(worker); true }) }
    }
}

package com.karvin.app.feature.map

import android.Manifest
import android.content.Intent
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.MapProperties
import com.google.maps.android.compose.MapUiSettings
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.karvin.app.BuildConfig
import com.karvin.app.core.designsystem.Avatar
import com.karvin.app.core.designsystem.EmptyState
import com.karvin.app.core.designsystem.JobCard
import com.karvin.app.core.designsystem.RatingLine
import com.karvin.app.core.designsystem.WorkerCard
import com.karvin.app.core.location.LocationResult
import com.karvin.app.core.location.LocationTracker
import com.karvin.app.core.navigation.Routes
import com.karvin.app.data.FakeData
import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.WorkerFilter
import com.karvin.app.feature.home.DefaultHomePoint
import com.karvin.app.feature.workers.WorkersViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MapLocationViewModel @Inject constructor(private val tracker: LocationTracker) : ViewModel() {
    val state: StateFlow<com.karvin.app.domain.model.LocationState> = tracker.state
    private val _point = MutableStateFlow(DefaultHomePoint)
    val point: StateFlow<com.karvin.app.domain.model.GeoPoint> = _point.asStateFlow()

    fun refresh() {
        tracker.refresh { result ->
            if (result is LocationResult.Available) _point.value = result.point
        }
    }
}

@Composable
fun MapScreen(navController: NavHostController, workerMode: Boolean, viewModel: MapLocationViewModel = hiltViewModel()) {
    val userPoint by viewModel.point.collectAsStateWithLifecycle()
    var showPermissionDialog by remember { mutableStateOf(false) }
    var selectedJobId by remember { mutableStateOf<String?>(null) }
    var selectedDistance by remember { mutableStateOf(DistanceFilter.ALL) }
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
        if (permissions.values.any { it }) viewModel.refresh()
    }

    LaunchedEffect(Unit) { viewModel.refresh() }
    val visibleJobs = remember(userPoint, selectedDistance) {
        FakeData.jobs.filter { job ->
            DistanceCalculator.matches(DistanceCalculator.distanceInKm(userPoint, job.point), selectedDistance)
        }
    }
    Box(Modifier.fillMaxSize()) {
        if (BuildConfig.MAPS_API_KEY.isNotBlank()) {
            RealJobMap(
                jobs = visibleJobs,
                userPoint = userPoint,
                selectedJobId = selectedJobId,
                onSelect = { selectedJobId = it },
            )
        } else {
            OfflineJobMap(jobs = visibleJobs, userPoint = userPoint, selectedJobId = selectedJobId, onSelect = { selectedJobId = it })
        }
        Row(
            Modifier
                .fillMaxWidth()
                .padding(top = 22.dp, start = 18.dp, end = 18.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            IconButton(onClick = { navController.popBackStack() }, modifier = Modifier.clip(CircleShape).background(MaterialTheme.colorScheme.surface).semantics { contentDescription = "بازگشت" }) { Text("‹", style = MaterialTheme.typography.headlineSmall) }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(onClick = { showPermissionDialog = true }, modifier = Modifier.clip(CircleShape).background(MaterialTheme.colorScheme.surface).semantics { contentDescription = "موقعیت من" }) { Icon(Icons.Default.MyLocation, "موقعیت من") }
                IconButton(onClick = { viewModel.refresh() }, modifier = Modifier.clip(CircleShape).background(MaterialTheme.colorScheme.surface).semantics { contentDescription = "تازه‌سازی نقشه" }) { Icon(Icons.Default.LocationOn, "تازه‌سازی") }
            }
        }
        Card(
            Modifier
                .align(Alignment.TopCenter)
                .padding(top = 84.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        ) { Text(if (BuildConfig.MAPS_API_KEY.isBlank()) "نمایش آفلاین موقعیت‌ها" else "کارهای اطراف شما", modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp), style = MaterialTheme.typography.labelLarge) }
        Row(
            Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            DistanceFilter.values().forEach { filter ->
                FilterChip(selected = selectedDistance == filter, onClick = { selectedDistance = filter }, label = { Text(filter.title()) })
            }
        }
        selectedJobId?.let { id ->
            val job = FakeData.jobs.firstOrNull { it.id == id }
            if (job != null) {
                Card(
                    Modifier
                        .align(Alignment.BottomCenter)
                        .fillMaxWidth()
                        .padding(bottom = 84.dp, start = 16.dp, end = 16.dp),
                    shape = RoundedCornerShape(20.dp),
                ) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(job.title, style = MaterialTheme.typography.titleLarge)
                        Text("${job.category.title} · ${DistanceCalculator.format(DistanceCalculator.distanceInKm(userPoint, job.point))}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Row(verticalAlignment = Alignment.CenterVertically) { Text(job.amount.toString(), color = MaterialTheme.colorScheme.primary, modifier = Modifier.weight(1f)); Button(onClick = { navController.navigate(Routes.jobDetails(job.id)) }) { Text("مشاهده درخواست") } }
                    }
                }
            }
        }
    }
    if (showPermissionDialog) {
        AlertDialog(
            onDismissRequest = { showPermissionDialog = false },
            title = { Text("فعال‌سازی موقعیت مکانی") },
            text = { Text("برای نمایش فاصله و کارهای اطراف، اجازه دسترسی به موقعیت مکانی لازم است.") },
            confirmButton = { Button(onClick = { showPermissionDialog = false; permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) }) { Text("اجازه می‌دهم") } },
            dismissButton = { TextButton(onClick = { showPermissionDialog = false }) { Text("بعداً") } },
        )
    }
}

@Composable
private fun RealJobMap(jobs: List<com.karvin.app.domain.model.Job>, userPoint: com.karvin.app.domain.model.GeoPoint, selectedJobId: String?, onSelect: (String) -> Unit) {
    val cameraState = rememberCameraPositionState()
    val center = LatLng(userPoint.latitude, userPoint.longitude)
    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraState,
        properties = MapProperties(isMyLocationEnabled = false),
        uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = false),
    ) {
        jobs.forEach { job ->
            Marker(state = MarkerState(LatLng(job.point.latitude, job.point.longitude)), title = job.title, snippet = job.category.title, onClick = { onSelect(job.id); true })
        }
    }
}

@Composable
private fun OfflineJobMap(jobs: List<com.karvin.app.domain.model.Job>, userPoint: com.karvin.app.domain.model.GeoPoint, selectedJobId: String?, onSelect: (String) -> Unit) {
    Box(Modifier.fillMaxSize().background(Color(0xFFE6EFED))) {
        Column(Modifier.fillMaxSize().padding(30.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("نقشه کارها", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary)
            Text("داده‌های نزدیک به موقعیت شما", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(25.dp))
            LazyColumn(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(jobs.take(14), key = { it.id }) { job ->
                    Card(onClick = { onSelect(job.id) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = if (selectedJobId == job.id) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface)) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(34.dp).clip(CircleShape).background(MaterialTheme.colorScheme.secondary), contentAlignment = Alignment.Center) { Text("ک", color = MaterialTheme.colorScheme.onSecondary) }
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) { Text(job.title, style = MaterialTheme.typography.titleMedium); Text(job.address, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                            Text(DistanceCalculator.format(DistanceCalculator.distanceInKm(userPoint, job.point)), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun WorkersMapScreen(navController: NavHostController, viewModel: WorkersViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var selectedWorker by remember { mutableStateOf<User?>(null) }
    Box(Modifier.fillMaxSize()) {
        if (BuildConfig.MAPS_API_KEY.isNotBlank()) {
            RealWorkerMap(state.workers, onSelect = { selectedWorker = it })
        } else {
            Column(Modifier.fillMaxSize().background(Color(0xFFE6EFED)).padding(top = 85.dp, start = 16.dp, end = 16.dp)) {
                Text("نیروهای آماده به کار", style = MaterialTheme.typography.headlineSmall)
                Text("نیروهای نزدیک و آنلاین را بررسی کنید.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                LazyColumn(Modifier.padding(top = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { items(state.workers.take(14), key = { it.id }) { worker -> WorkerCard(worker, DefaultHomePoint, { selectedWorker = worker }, { viewModel.favorite(worker.id) }) } }
            }
        }
        IconButton(onClick = { navController.popBackStack() }, modifier = Modifier.padding(top = 22.dp, start = 18.dp).clip(CircleShape).background(MaterialTheme.colorScheme.surface).semantics { contentDescription = "بازگشت" }) { Text("‹", style = MaterialTheme.typography.headlineSmall) }
        Card(Modifier.align(Alignment.TopCenter).padding(top = 23.dp), shape = RoundedCornerShape(12.dp)) { Text("نقشه نیروها", Modifier.padding(horizontal = 14.dp, vertical = 9.dp), style = MaterialTheme.typography.labelLarge) }
        selectedWorker?.let { worker ->
            Card(Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(16.dp), shape = RoundedCornerShape(20.dp)) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Avatar(worker, size = 48.dp); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f)) { Text(worker.name, style = MaterialTheme.typography.titleMedium); RatingLine(worker.rating, worker.reviewCount) }; Text(if (worker.isAvailable) "آنلاین" else "آفلاین", color = if (worker.isAvailable) Color(0xFF2C8B57) else MaterialTheme.colorScheme.onSurfaceVariant) }; Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { OutlinedButton(onClick = { navController.navigate(Routes.workerDetails(worker.id)) }, modifier = Modifier.weight(1f)) { Text("مشاهده پروفایل") }; Button(onClick = { navController.navigate(Routes.createJob(worker.id)) }, modifier = Modifier.weight(1f)) { Text("ارسال پیشنهاد") } } }
            }
        }
    }
}

@Composable
private fun RealWorkerMap(workers: List<User>, onSelect: (User) -> Unit) {
    val cameraState = rememberCameraPositionState()
    GoogleMap(Modifier.fillMaxSize(), cameraPositionState = cameraState, uiSettings = MapUiSettings(zoomControlsEnabled = false)) {
        workers.forEach { worker -> Marker(state = MarkerState(LatLng(worker.point.latitude, worker.point.longitude)), title = worker.name, snippet = worker.skills.firstOrNull(), onClick = { onSelect(worker); true }) }
    }
}

private fun DistanceFilter.title(): String = when (this) {
    DistanceFilter.UNDER_ONE -> "۱ km"
    DistanceFilter.UNDER_THREE -> "۳ km"
    DistanceFilter.UNDER_FIVE -> "۵ km"
    DistanceFilter.UNDER_TEN -> "۱۰ km"
    DistanceFilter.ALL -> "همه"
}

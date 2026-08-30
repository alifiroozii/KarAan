package com.karvin.app.feature.map

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
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
import androidx.compose.material3.CardDefaults
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
import androidx.compose.material3.rememberModalBottomSheetState
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
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
import com.karvin.app.core.designsystem.KarvinHomeScaffold
import com.karvin.app.core.designsystem.OnlinePill
import com.karvin.app.core.designsystem.PrimaryButton
import com.karvin.app.core.designsystem.RatingLine
import com.karvin.app.core.navigation.Routes
import com.karvin.app.data.FakeData
import com.karvin.app.data.FakeNearbyData
import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.NearbyProvider
import com.karvin.app.domain.model.RequesterMapFilter
import com.karvin.app.domain.model.toPersianDigits
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

// ──────────────────────── ViewModel ────────────────────────

data class RequesterMapUiState(
    val providers: List<NearbyProvider> = emptyList(),
    val filteredProviders: List<NearbyProvider> = emptyList(),
    val filter: RequesterMapFilter = RequesterMapFilter(),
    val userPoint: GeoPoint = GeoPoint(35.7219, 51.3347),
    val selectedProvider: NearbyProvider? = null,
    val loading: Boolean = true,
)

@HiltViewModel
class RequesterMapViewModel @Inject constructor() : ViewModel() {
    private val _state = MutableStateFlow(RequesterMapUiState())
    val state: StateFlow<RequesterMapUiState> = _state.asStateFlow()

    init {
        loadProviders()
    }

    private fun loadProviders() {
        val providers = FakeNearbyData.generateProviders(_state.value.userPoint)
        _state.update { it.copy(providers = providers, filteredProviders = providers, loading = false) }
    }

    fun updateFilter(filter: RequesterMapFilter) {
        _state.update { state ->
            state.copy(
                filter = filter,
                filteredProviders = filterProviders(state.providers, state.userPoint, filter),
            )
        }
    }

    private fun filterProviders(
        providers: List<NearbyProvider>,
        userPoint: GeoPoint,
        filter: RequesterMapFilter,
    ): List<NearbyProvider> = providers.filter { provider ->
        val queryMatch = filter.query.isBlank() ||
            provider.name.contains(filter.query, ignoreCase = true) ||
            provider.primarySkill.contains(filter.query, ignoreCase = true) ||
            provider.skills.any { it.contains(filter.query, ignoreCase = true) }
        val categoryMatch = filter.categoryId == null || FakeNearbyData.categoryIdForProvider(provider) == filter.categoryId
        val ratingMatch = filter.minimumRating == null || provider.rating >= filter.minimumRating
        val availableMatch = !filter.availableOnly || provider.isAvailable
        val verifiedMatch = !filter.verifiedOnly || provider.isVerified
        val distanceMatch = filter.distanceFilter == DistanceFilter.ALL ||
            DistanceCalculator.matches(
                DistanceCalculator.distanceInKm(userPoint, provider.point),
                filter.distanceFilter,
            )
        queryMatch && categoryMatch && ratingMatch && availableMatch && verifiedMatch && distanceMatch
    }

    fun selectProvider(provider: NearbyProvider?) {
        _state.update { it.copy(selectedProvider = provider) }
    }

    fun searchAround(center: GeoPoint) {
        val providers = FakeNearbyData.generateProviders(center)
        _state.update {
            it.copy(
                userPoint = center,
                providers = providers,
                filteredProviders = filterProviders(providers, center, it.filter),
            )
        }
    }
}

// ──────────────────────── Screen ────────────────────────

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun RequesterMapScreen(
    navController: NavHostController,
    viewModel: RequesterMapViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var listMode by remember { mutableStateOf(false) }
    var showFilters by remember { mutableStateOf(false) }
    var showPermissionDialog by remember { mutableStateOf(false) }
    var showLocationExplanation by remember { mutableStateOf(false) }
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(
            LatLng(state.userPoint.latitude, state.userPoint.longitude),
            14f,
        )
    }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* Permission result handled by LocationTracker */ }

    // Category chips from FakeData
    val categories = remember { FakeData.categories.take(6) }

    KarvinHomeScaffold(navController, providerMode = false) { padding ->
    Box(Modifier.fillMaxSize().padding(padding)) {
        // Map or List
        if (listMode) {
            // List view
            LazyColumn(
                Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(top = 130.dp, start = 16.dp, end = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (state.filteredProviders.isEmpty()) {
                    item {
                        Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("⌁", style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.primary)
                                Text("متخصصی در این محدوده پیدا نشد", style = MaterialTheme.typography.titleMedium)
                                OutlinedButton(onClick = { viewModel.updateFilter(state.filter.copy(distanceFilter = DistanceFilter.ALL)) }) { Text("افزایش محدوده") }
                            }
                        }
                    }
                }
                items(state.filteredProviders, key = { it.id }) { provider ->
                    ProviderListCard(provider, state.userPoint) {
                        viewModel.selectProvider(provider)
                    }
                }
                item { Spacer(Modifier.height(20.dp)) }
            }
        } else {
            // Map view
            RequesterGoogleMap(
                state = state,
                cameraPositionState = cameraPositionState,
                onProviderClick = { viewModel.selectProvider(it) },
                onMyLocation = { showPermissionDialog = true },
                onSearchThisArea = {
                    val target = cameraPositionState.position.target
                    viewModel.searchAround(GeoPoint(target.latitude, target.longitude))
                },
            )
        }

        // Floating search bar
        Column(
            Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, start = 16.dp, end = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = state.filter.query,
                    onValueChange = { viewModel.updateFilter(state.filter.copy(query = it)) },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("جستجو در تخصص یا نام") },
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Default.Search, null) },
                    shape = RoundedCornerShape(16.dp),
                )
                IconButton(
                    onClick = { showFilters = true },
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(
                            if (state.filter != RequesterMapFilter()) MaterialTheme.colorScheme.primaryContainer
                            else MaterialTheme.colorScheme.surface,
                        )
                        .semantics { contentDescription = "فیلترها" },
                ) {
                    Icon(
                        Icons.Default.FilterAlt, null,
                        tint = if (state.filter != RequesterMapFilter()) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.onSurface,
                    )
                }
            }
            // Category chips
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = state.filter.categoryId == null,
                    onClick = { viewModel.updateFilter(state.filter.copy(categoryId = null)) },
                    label = { Text("همه") },
                )
                categories.forEach { category ->
                    FilterChip(
                        selected = state.filter.categoryId == category.id,
                        onClick = { viewModel.updateFilter(state.filter.copy(categoryId = if (state.filter.categoryId == category.id) null else category.id)) },
                        label = { Text(category.title) },
                    )
                }
            }
        }

        // Bottom area
        Column(
            Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // Radius chips
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(1.0, 3.0, 5.0, 10.0, 20.0).forEach { km ->
                    FilterChip(
                        selected = state.filter.distanceFilter.maxKm == km,
                        onClick = { viewModel.updateFilter(state.filter.copy(distanceFilter = DistanceFilter.values().first { it.maxKm == km })) },
                        label = { Text("${km.toInt().toString().toPersianDigits()} کیلومتر") },
                    )
                }
            }
            // Map/List toggle
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SingleChoiceSegmentedButtonRow(Modifier.weight(1f)) {
                    listOf("نقشه", "لیست").forEachIndexed { index, title ->
                        SegmentedButton(
                            selected = listMode == (index == 1),
                            onClick = { listMode = index == 1 },
                            shape = SegmentedButtonDefaults.itemShape(index, 2),
                            icon = {},
                        ) { Text(title) }
                    }
                }
                // Info badge
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.primaryContainer,
                ) {
                    Text(
                        "${state.filteredProviders.size.toString().toPersianDigits()} متخصص",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
        }

        // Radius circle on map
        if (!listMode && state.filter.distanceFilter != DistanceFilter.ALL) {
            Circle(
                center = LatLng(state.userPoint.latitude, state.userPoint.longitude),
                radius = state.filter.distanceFilter.maxKm!! * 1000.0,
                strokeColor = MaterialTheme.colorScheme.primary,
                strokeWidth = 3f,
                fillColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f),
            )
        }

        // Loading indicator
        if (state.loading) {
            Column(
                Modifier.align(Alignment.Center).padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Surface(Modifier.size(52.dp), shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer) {}
                Surface(Modifier.width(150.dp).height(16.dp), shape = RoundedCornerShape(8.dp), color = MaterialTheme.colorScheme.surfaceVariant) {}
            }
        }
    }

    }

    // Location explanation dialog
    if (showLocationExplanation) {
        LocationExplanationDialog(
            accent = MaterialTheme.colorScheme.primary,
            onContinue = {
                showLocationExplanation = false
                runCatching {
                    launcher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
                }
            },
            onDemo = { showLocationExplanation = false },
            onLater = { showLocationExplanation = false },
        )
    }

    // Permission dialog
    if (showPermissionDialog) {
        AlertDialog(
            onDismissRequest = { showPermissionDialog = false },
            title = { Text("دسترسی موقعیت مکانی") },
            text = { Text("برای نمایش متخصص‌های نزدیک، موقعیت تقریبی یا دقیق شما کافی است.") },
            confirmButton = {
                Button(onClick = {
                    showPermissionDialog = false
                    runCatching {
                    launcher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
                }
                }) { Text("فعال کردن موقعیت") }
            },
            dismissButton = {
                TextButton(onClick = { showPermissionDialog = false }) { Text("حالت نمایشی") }
            },
        )
    }

    // Provider bottom sheet
    state.selectedProvider?.let { provider ->
        ProviderBottomSheet(
            provider = provider,
            userPoint = state.userPoint,
            onDismiss = { viewModel.selectProvider(null) },
            onViewProfile = {
                viewModel.selectProvider(null)
                navController.navigate(Routes.providerProfile(provider.id))
            },
            onRequest = {
                viewModel.selectProvider(null)
                navController.navigate(Routes.requestSent(provider = false))
            },
        )
    }

    // Filter bottom sheet
    if (showFilters) {
        RequesterFilterSheet(
            current = state.filter,
            onApply = { next -> viewModel.updateFilter(next); showFilters = false },
            onClear = { viewModel.updateFilter(RequesterMapFilter()); showFilters = false },
            onDismiss = { showFilters = false },
        )
    }
}

// ──────────────────────── Google Map ────────────────────────

@Composable
private fun BoxScope.RequesterGoogleMap(
    state: RequesterMapUiState,
    cameraPositionState: CameraPositionState,
    onProviderClick: (NearbyProvider) -> Unit,
    onMyLocation: () -> Unit,
    onSearchThisArea: () -> Unit,
) {
    GoogleMap(
        Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState,
        properties = MapProperties(isMyLocationEnabled = false),
        uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = false),
    ) {
        // Provider markers
        state.filteredProviders.forEach { provider ->
            Marker(
                state = MarkerState(LatLng(provider.point.latitude, provider.point.longitude)),
                title = provider.name,
                snippet = provider.primarySkill,
                onClick = {
                    onProviderClick(provider)
                    true
                },
            )
        }
    }

    // My Location button
    IconButton(
        onClick = onMyLocation,
        modifier = Modifier
            .align(Alignment.CenterEnd)
            .padding(top = 140.dp, end = 12.dp)
            .size(44.dp)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.surface)
            .semantics { contentDescription = "موقعیت من" },
    ) {
        Icon(Icons.Default.MyLocation, null)
    }
}

// ──────────────────────── Provider List Card ────────────────────────

@Composable
private fun ProviderListCard(
    provider: NearbyProvider,
    userPoint: GeoPoint,
    onClick: () -> Unit,
) {
    val distance = DistanceCalculator.distanceInKm(userPoint, provider.point)
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(
            Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Avatar circle
            Box(
                Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    provider.name.take(1),
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(provider.name, style = MaterialTheme.typography.titleMedium)
                    if (provider.isVerified) {
                        Spacer(Modifier.width(5.dp))
                        Icon(
                            Icons.Default.CheckCircle, "احراز هویت شده",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(16.dp),
                        )
                    }
                }
                Text(provider.primarySkill, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    RatingLine(provider.rating)
                    Text(DistanceCalculator.format(distance), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                OnlinePill(provider.isAvailable)
                Text(
                    "${provider.basePrice.toString().toPersianDigits()} ریال",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

// ──────────────────────── Provider Bottom Sheet ────────────────────────

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
private fun ProviderBottomSheet(
    provider: NearbyProvider,
    userPoint: GeoPoint,
    onDismiss: () -> Unit,
    onViewProfile: () -> Unit,
    onRequest: () -> Unit,
) {
    val distance = DistanceCalculator.distanceInKm(userPoint, provider.point)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        sheetState = rememberModalBottomSheetState(),
    ) {
        Column(
            Modifier
                .padding(horizontal = 22.dp)
                .padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Header
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        provider.name.take(1),
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                }
                Column(Modifier.weight(1f)) {
                    Text(provider.name, style = MaterialTheme.typography.headlineSmall)
                    Text(provider.primarySkill, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        RatingLine(provider.rating, provider.reviewCount)
                        OnlinePill(provider.isAvailable)
                    }
                }
            }

            // Stats row
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatChip("امتیاز", String.format(java.util.Locale.US, "%.1f", provider.rating), Modifier.weight(1f))
                StatChip("نظر", provider.reviewCount.toString().toPersianDigits(), Modifier.weight(1f))
                StatChip("فاصله", DistanceCalculator.format(distance), Modifier.weight(1f))
                StatChip("کار", provider.completedJobs.toString().toPersianDigits(), Modifier.weight(1f))
            }

            // Response time
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Icon(Icons.Default.Schedule, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(18.dp))
                Text("زمان پاسخ: ${provider.responseTime}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            // Skills
            Text("خدمات قابل ارائه", style = MaterialTheme.typography.titleMedium)
            @OptIn(ExperimentalLayoutApi::class)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                provider.skills.forEach { skill ->
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        Text(skill, Modifier.padding(horizontal = 10.dp, vertical = 6.dp), style = MaterialTheme.typography.labelLarge)
                    }
                }
            }

            // Buttons
            OutlinedButton(
                onClick = onViewProfile,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(14.dp),
            ) { Text("مشاهده پروفایل") }

            PrimaryButton(
                "ارسال درخواست",
                onRequest,
                Modifier.fillMaxWidth(),
            )
        }
    }
}

// ──────────────────────── Stat Chip ────────────────────────

@Composable
private fun StatChip(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(
            Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(value, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

// ──────────────────────── Filter Sheet ────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RequesterFilterSheet(
    current: RequesterMapFilter,
    onApply: (RequesterMapFilter) -> Unit,
    onClear: () -> Unit,
    onDismiss: () -> Unit,
) {
    var distance by remember { mutableStateOf(current.distanceFilter) }
    var availableOnly by remember { mutableStateOf(current.availableOnly) }
    var verifiedOnly by remember { mutableStateOf(current.verifiedOnly) }
    var minRating by remember { mutableStateOf(current.minimumRating ?: 0.0) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
    ) {
        Column(
            Modifier.padding(horizontal = 22.dp).padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text("فیلترها", style = MaterialTheme.typography.headlineSmall)

            // Distance
            Text("محدوده جستجو", style = MaterialTheme.typography.titleMedium)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DistanceFilter.values().filter { it != DistanceFilter.ALL }.forEach { option ->
                    FilterChip(
                        selected = distance == option,
                        onClick = { distance = option },
                        label = { Text(option.label) },
                    )
                }
            }

            // Toggles
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("فقط افراد آنلاین", Modifier.weight(1f))
                Switch(checked = availableOnly, onCheckedChange = { availableOnly = it }, colors = SwitchDefaults.colors(checkedTrackColor = com.karvin.app.core.designsystem.OnlineGreen))
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("فقط افراد تایید شده", Modifier.weight(1f))
                Switch(checked = verifiedOnly, onCheckedChange = { verifiedOnly = it }, colors = SwitchDefaults.colors(checkedTrackColor = com.karvin.app.core.designsystem.OnlineGreen))
            }

            // Rating
            Text("حداقل امتیاز", style = MaterialTheme.typography.titleMedium)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(0.0 to "هیچ", 3.0 to "۳+", 4.0 to "۴٫۰+", 4.5 to "۴٫۵+").forEach { (value, title) ->
                    FilterChip(
                        selected = minRating == value,
                        onClick = { minRating = value },
                        label = { Text(title) },
                    )
                }
            }

            // Actions
            PrimaryButton(
                "اعمال فیلترها",
                { onApply(current.copy(distanceFilter = distance, availableOnly = availableOnly, verifiedOnly = verifiedOnly, minimumRating = minRating.takeIf { it > 0 })) },
                Modifier.fillMaxWidth(),
            )
            TextButton(onClick = onClear, modifier = Modifier.fillMaxWidth()) {
                Text("پاک کردن فیلترها")
            }
        }
    }
}

// ──────────────────────── Location Explanation Dialog ────────────────────────

@Composable
private fun LocationExplanationDialog(
    accent: Color,
    onContinue: () -> Unit,
    onDemo: () -> Unit,
    onLater: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onLater,
        shape = RoundedCornerShape(24.dp),
        icon = {
            Box(
                Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(accent.copy(alpha = .12f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.LocationOn, null, tint = accent, modifier = Modifier.size(36.dp))
            }
        },
        title = { Text("دسترسی به موقعیت مکانی", textAlign = TextAlign.Center) },
        text = {
            Text(
                "برای یافتن متخصص‌های نزدیک و نمایش آنها بر اساس موقعیت مکانی.",
                textAlign = TextAlign.Center,
            )
        },
        confirmButton = {
            Button(onClick = onContinue, modifier = Modifier.fillMaxWidth()) { Text("ادامه") }
        },
        dismissButton = {
            Column {
                TextButton(onClick = onLater, modifier = Modifier.fillMaxWidth()) { Text("فعلاً نه") }
                TextButton(onClick = onDemo, modifier = Modifier.fillMaxWidth()) { Text("ادامه با حالت نمایشی", color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
        },
    )
}

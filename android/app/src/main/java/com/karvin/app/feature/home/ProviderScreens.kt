package com.karvin.app.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Schedule
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
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.MapProperties
import com.google.maps.android.compose.MapUiSettings
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.KarvinFab
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
import com.karvin.app.domain.model.NearbyServiceRequest
import com.karvin.app.domain.model.ProviderMapFilter
import com.karvin.app.domain.model.toPersianDigits
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

// ──────────────────────── ViewModel ────────────────────────

data class ProviderHomeUiState(
    val isAvailable: Boolean = false,
    val requests: List<NearbyServiceRequest> = emptyList(),
    val nearbyCount: Int = 0,
    val inProgress: Int = 0,
    val completedToday: Int = 0,
)

data class ProviderMapUiState(
    val requests: List<NearbyServiceRequest> = emptyList(),
    val filteredRequests: List<NearbyServiceRequest> = emptyList(),
    val filter: ProviderMapFilter = ProviderMapFilter(),
    val userPoint: GeoPoint = GeoPoint(35.7219, 51.3347),
    val selectedRequest: NearbyServiceRequest? = null,
    val isAvailable: Boolean = false,
    val loading: Boolean = true,
)

@HiltViewModel
class ProviderHomeViewModel @Inject constructor() : ViewModel() {
    private val _homeState = MutableStateFlow(ProviderHomeUiState())
    val homeState: StateFlow<ProviderHomeUiState> = _homeState.asStateFlow()

    private val _mapState = MutableStateFlow(ProviderMapUiState())
    val mapState: StateFlow<ProviderMapUiState> = _mapState.asStateFlow()

    init {
        val requests = FakeNearbyData.generateRequests()
        _homeState.update { it.copy(requests = requests, nearbyCount = requests.size) }
        _mapState.update { it.copy(requests = requests, filteredRequests = requests, loading = false) }
    }

    fun toggleAvailability() {
        val available = !_homeState.value.isAvailable
        _homeState.update { it.copy(isAvailable = available) }
        _mapState.update { it.copy(isAvailable = available) }
    }

    fun updateFilter(filter: ProviderMapFilter) {
        _mapState.update { state ->
            val filtered = filterRequests(state.requests, state.userPoint, filter)
            state.copy(filter = filter, filteredRequests = filtered)
        }
    }

    private fun filterRequests(
        requests: List<NearbyServiceRequest>,
        userPoint: GeoPoint,
        filter: ProviderMapFilter,
    ): List<NearbyServiceRequest> = requests.filter { req ->
        val queryMatch = filter.query.isBlank() ||
            req.title.contains(filter.query, ignoreCase = true) ||
            req.category.title.contains(filter.query, ignoreCase = true)
        val categoryMatch = filter.categoryId == null || req.category.id == filter.categoryId
        val urgentMatch = !filter.urgentOnly || req.isUrgent
        val distanceMatch = filter.distanceFilter == DistanceFilter.ALL ||
            DistanceCalculator.matches(
                DistanceCalculator.distanceInKm(userPoint, req.point),
                filter.distanceFilter,
            )
        queryMatch && categoryMatch && urgentMatch && distanceMatch
    }

    fun selectRequest(request: NearbyServiceRequest?) {
        _mapState.update { it.copy(selectedRequest = request) }
    }

    fun searchAround(center: GeoPoint) {
        val requests = FakeNearbyData.generateRequests(center)
        _mapState.update {
            it.copy(
                userPoint = center,
                requests = requests,
                filteredRequests = filterRequests(requests, center, it.filter),
            )
        }
    }
}

// ──────────────────────── Provider Home Screen ────────────────────────

@Composable
fun ProviderHomeScreen(
    navController: NavHostController,
    viewModel: ProviderHomeViewModel = hiltViewModel(),
) {
    val state by viewModel.homeState.collectAsStateWithLifecycle()

    KarvinHomeScaffold(navController, providerMode = true) { padding ->
        LazyColumn(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                AppTopBar("خانه", actions = {
                    IconButton(onClick = { navController.navigate(Routes.Notifications) }) {
                        Text("🔔", fontSize = 20.sp)
                    }
                })
            }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text("سلام 👋", style = MaterialTheme.typography.headlineSmall)
                Text(
                    "درخواست‌های نزدیک را ببین و اعلام آمادگی کن.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        // Availability toggle
        item {
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (state.isAvailable) com.karvin.app.core.designsystem.OnlineGreen.copy(alpha = .14f)
                    else MaterialTheme.colorScheme.surfaceVariant,
                ),
                shape = RoundedCornerShape(18.dp),
            ) {
                Row(
                    Modifier.padding(18.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        Text(
                            if (state.isAvailable) "آنلاین هستم" else "آفلاین هستید",
                            style = MaterialTheme.typography.titleMedium,                            color = if (state.isAvailable) com.karvin.app.core.designsystem.OnlineGreenDark else MaterialTheme.colorScheme.onSurface,
                        )
                        Text(
                            if (state.isAvailable) "درخواست‌دهنده‌ها می‌توانند شما را ببینند." else "برای دریافت درخواست‌های نزدیک، وضعیتت را فعال کن.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Switch(
                        checked = state.isAvailable,
                        onCheckedChange = { viewModel.toggleAvailability() },
                        colors = SwitchDefaults.colors(checkedTrackColor = com.karvin.app.core.designsystem.OnlineGreen),
                        modifier = Modifier.semantics { contentDescription = "وضعیت آنلاین" },
                    )
                }
            }
        }

        // Stats
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatBox(state.nearbyCount, "درخواست نزدیک", Modifier.weight(1f))
                StatBox(state.inProgress, "در حال انجام", Modifier.weight(1f))
                StatBox(state.completedToday, "کار امروز", Modifier.weight(1f))
            }
        }

        // Nearby requests header
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("درخواست‌های نزدیک", style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
                TextButton(onClick = { navController.navigate(Routes.ProviderMap) }) {
                    Text("مشاهده روی نقشه", color = MaterialTheme.colorScheme.primary)
                }
            }
        }

        // Nearby request cards
        items(state.requests.take(5), key = { it.id }) { request ->
            Card(
                onClick = { navController.navigate(Routes.ProviderMap) },
                shape = RoundedCornerShape(14.dp),
            ) {
                Row(
                    Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (request.isUrgent) MaterialTheme.colorScheme.secondaryContainer
                        else MaterialTheme.colorScheme.primaryContainer,
                    ) {
                        Text(
                            request.title.take(1),
                            Modifier.padding(10.dp),
                            style = MaterialTheme.typography.titleMedium,
                            color = if (request.isUrgent) MaterialTheme.colorScheme.onSecondaryContainer
                            else MaterialTheme.colorScheme.primary,
                        )
                    }
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(request.title, style = MaterialTheme.typography.titleMedium)
                            if (request.isUrgent) {
                                Spacer(Modifier.width(6.dp))
                                Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = RoundedCornerShape(6.dp)) {
                                    Text("فوری", Modifier.padding(horizontal = 6.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSecondaryContainer)
                                }
                            }
                        }
                        Text(request.category.title, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                    }
                    Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text(request.budgetLabel, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                        Text(request.createdAt, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }

            item { Spacer(Modifier.height(84.dp)) }
        }
    }
}

@Composable
private fun StatBox(value: Int, label: String, modifier: Modifier) {
    Card(
        modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(
            Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(value.toString().toPersianDigits(), style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

// ──────────────────────── Provider Map Screen ────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProviderMapScreen(
    navController: NavHostController,
    viewModel: ProviderHomeViewModel = hiltViewModel(),
) {
    val state by viewModel.mapState.collectAsStateWithLifecycle()
    var listMode by remember { mutableStateOf(false) }
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(
            LatLng(state.userPoint.latitude, state.userPoint.longitude),
            14f,
        )
    }

    val categories = remember { FakeData.categories.take(6) }

    KarvinHomeScaffold(navController, providerMode = true) { padding ->
    Box(Modifier.fillMaxSize().padding(padding)) {
        // Map or List
        if (listMode) {
            LazyColumn(
                Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(top = 130.dp, start = 16.dp, end = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (state.filteredRequests.isEmpty()) {
                    item {
                        Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("⌁", style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.secondary)
                                Text("درخواستی در این محدوده پیدا نشد", style = MaterialTheme.typography.titleMedium)
                                OutlinedButton(onClick = { viewModel.updateFilter(state.filter.copy(distanceFilter = DistanceFilter.ALL)) }) { Text("افزایش محدوده") }
                            }
                        }
                    }
                }
                items(state.filteredRequests, key = { it.id }) { request ->
                    ProviderRequestListCard(request, state.userPoint) {
                        viewModel.selectRequest(request)
                    }
                }
                item { Spacer(Modifier.height(20.dp)) }
            }
        } else {
            ProviderGoogleMap(
                state = state,
                cameraPositionState = cameraPositionState,
                onRequestClick = { viewModel.selectRequest(it) },
                onMyLocation = {},
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
                androidx.compose.material3.OutlinedTextField(
                    value = state.filter.query,
                    onValueChange = { viewModel.updateFilter(state.filter.copy(query = it)) },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("جستجو در درخواست‌ها") },
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Default.MyLocation, null) },
                    shape = RoundedCornerShape(16.dp),
                )
            }
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = state.filter.categoryId == null,
                    onClick = { viewModel.updateFilter(state.filter.copy(categoryId = null)) },
                    label = { Text("همه") },
                )
                categories.take(4).forEach { category ->
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
                        selected = state.filter.distanceFilter == DistanceFilter.values().firstOrNull { it.maxKm == km },
                        onClick = { viewModel.updateFilter(state.filter.copy(distanceFilter = DistanceFilter.values().firstOrNull { it.maxKm == km } ?: DistanceFilter.ALL)) },
                        label = { Text("${km.toInt().toString().toPersianDigits()} کیلومتر") },
                    )
                }
            }
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
                // Availability badge
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = if (state.isAvailable) com.karvin.app.core.designsystem.OnlineGreen.copy(alpha = .14f) else MaterialTheme.colorScheme.surfaceVariant,
                ) {
                    Text(
                        if (state.isAvailable) "آنلاین" else "آفلاین",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = if (state.isAvailable) com.karvin.app.core.designsystem.OnlineGreenDark else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        if (state.loading) {
            Column(
                Modifier.align(Alignment.Center).padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Surface(Modifier.size(52.dp), shape = CircleShape, color = MaterialTheme.colorScheme.secondaryContainer) {}
                Surface(Modifier.width(150.dp).height(16.dp), shape = RoundedCornerShape(8.dp), color = MaterialTheme.colorScheme.surfaceVariant) {}
            }
        }
    }    }

        // Request bottom sheet

    state.selectedRequest?.let { request ->
        RequestBottomSheet(
            request = request,
            onDismiss = { viewModel.selectRequest(null) },
            onDeclare = {
                viewModel.selectRequest(null)
                navController.navigate(Routes.AvailabilityDeclared)
            },
        )
    }
}

// ──────────────────────── Provider Google Map ────────────────────────

@Composable
private fun BoxScope.ProviderGoogleMap(
    state: ProviderMapUiState,
    cameraPositionState: CameraPositionState,
    onRequestClick: (NearbyServiceRequest) -> Unit,
    onMyLocation: () -> Unit,
    onSearchThisArea: () -> Unit,
) {
    GoogleMap(
        Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState,
        properties = MapProperties(isMyLocationEnabled = false),
        uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = false),
    ) {
        state.filteredRequests.forEach { request ->
            Marker(
                state = MarkerState(LatLng(request.point.latitude, request.point.longitude)),
                title = request.title,
                snippet = request.budgetLabel,
                onClick = {
                    onRequestClick(request)
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

// ──────────────────────── Provider Request List Card ────────────────────────

@Composable
private fun ProviderRequestListCard(
    request: NearbyServiceRequest,
    userPoint: GeoPoint,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(
            Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = if (request.isUrgent) MaterialTheme.colorScheme.secondaryContainer
                else MaterialTheme.colorScheme.primaryContainer,
                modifier = Modifier.size(48.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        request.title.take(1),
                        style = MaterialTheme.typography.titleMedium,
                        color = if (request.isUrgent) MaterialTheme.colorScheme.onSecondaryContainer
                        else MaterialTheme.colorScheme.primary,
                    )
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(request.title, style = MaterialTheme.typography.titleMedium)
                    if (request.isUrgent) {
                        Spacer(Modifier.width(6.dp))
                        Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = RoundedCornerShape(6.dp)) {
                            Text("فوری", Modifier.padding(horizontal = 6.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSecondaryContainer)
                        }
                    }
                }
                Text(request.category.title, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(request.scheduledTime, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("·", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(request.approximateAddress, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(request.budgetLabel, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                RatingLine(request.requesterRating)
            }
        }
    }
}

// ──────────────────────── Request Bottom Sheet ────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RequestBottomSheet(
    request: NearbyServiceRequest,
    onDismiss: () -> Unit,
    onDeclare: () -> Unit,
) {
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
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Icon(
                        Icons.Default.Schedule, null,
                        Modifier.padding(10.dp),
                        tint = MaterialTheme.colorScheme.secondary,
                    )
                }
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(request.title, style = MaterialTheme.typography.headlineSmall)
                        if (request.isUrgent) {
                            Spacer(Modifier.width(8.dp))
                            Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = RoundedCornerShape(6.dp)) {
                                Text("فوری", Modifier.padding(horizontal = 6.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSecondaryContainer)
                            }
                        }
                    }
                    Text("دسته‌بندی: ${request.category.title}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // Info rows
            SheetInfoRow("💰", "بودجه", request.budgetLabel)
            SheetInfoRow("📍", "زمان", request.scheduledTime)
            SheetInfoRow("📍", "محل", request.approximateAddress)
            SheetInfoRow("⏰", "ثبت شده", request.createdAt)

            // Description
            Text("توضیحات", style = MaterialTheme.typography.titleMedium)
            Text(request.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)

            // Requester
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(
                    Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.secondaryContainer),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(request.requesterName.take(1), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSecondaryContainer)
                }
                Column(Modifier.weight(1f)) {
                    Text(request.requesterName, style = MaterialTheme.typography.titleMedium)
                    RatingLine(request.requesterRating)
                }
            }

            // CTA
            Button(
                onClick = onDeclare,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
            ) {
                Text("اعلام آمادگی", color = MaterialTheme.colorScheme.onSecondary)
            }

            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                Text("بستن")
            }
        }
    }
}

@Composable
private fun SheetInfoRow(emoji: String, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(emoji, fontSize = 16.sp)
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.titleMedium)
    }
}

// ──────────────────────── Availability Declared Screen ────────────────────────

@Composable
fun AvailabilityDeclaredScreen(navController: NavHostController) {
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Box(
                Modifier
                    .size(160.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.secondaryContainer.copy(alpha = .55f)),
            )
            Box(
                Modifier
                    .size(124.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.secondaryContainer),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Default.CheckCircle, null,
                    tint = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.size(56.dp),
                )
            }
        }
        Spacer(Modifier.height(28.dp))
        Text("آمادگی شما ثبت شد!", style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
        Spacer(Modifier.height(10.dp))
        Text(
            "در صورت انتخاب، درخواست‌دهنده با شما در ارتباط خواهد بود.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(36.dp))
        Button(
            onClick = { navController.popBackStack() },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
        ) { Text("متوجه شدم", color = MaterialTheme.colorScheme.onSecondary) }
    }
}

// ──────────────────────── Requester Home Screen ────────────────────────

@Composable
fun RequesterHomeScreen(
    navController: NavHostController,
    viewModel: RequesterHomeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    KarvinHomeScaffold(navController, providerMode = false) { padding ->
        LazyColumn(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                AppTopBar("خانه", actions = {
                    IconButton(onClick = { navController.navigate(Routes.Notifications) }) {
                        Text("🔔", fontSize = 20.sp)
                    }
                })
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text("سلام 👋", style = MaterialTheme.typography.headlineSmall)
                    Text(
                        "چه خدمتی نیاز دارید؟",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

        // Search card
        item {
            Card(
                onClick = { navController.navigate(Routes.RequesterMap) },
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(20.dp),
            ) {
                Row(
                    Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("جستجوی متخصص", color = Color.White, style = MaterialTheme.typography.titleLarge)
                        Text("نزدیک‌ترین متخصص را روی نقشه پیدا کنید.", color = Color.White.copy(alpha = .82f), style = MaterialTheme.typography.bodyMedium)
                    }
                    Text("⌖", color = Color.White, style = MaterialTheme.typography.displaySmall)
                }
            }
        }

        // Categories
        item { Text("دسته‌بندی‌ها", style = MaterialTheme.typography.titleLarge) }
        item {
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FakeData.categories.take(8).forEach { category ->
                    Surface(
                        onClick = { navController.navigate(Routes.RequesterMap) },
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant,
                    ) {
                        Column(
                            Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Text(category.icon, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
                            Text(category.title, style = MaterialTheme.typography.labelLarge)
                        }
                    }
                }
            }
        }

        // Stats
        item { Text("خلاصه", style = MaterialTheme.typography.titleLarge) }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Card(Modifier.weight(1f), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                    Column(Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(state.activeJobs.toString().toPersianDigits(), style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
                        Text("درخواست فعال", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                Card(Modifier.weight(1f), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)) {
                    Column(Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(state.completedJobs.toString().toPersianDigits(), style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.secondary)
                        Text("تکمیل شده", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }

            item { Spacer(Modifier.height(84.dp)) }
        }
    }
}

data class RequesterHomeUiState(
    val activeJobs: Int = 2,
    val completedJobs: Int = 7,
)

@HiltViewModel
class RequesterHomeViewModel @Inject constructor() : ViewModel() {
    private val _state = MutableStateFlow(RequesterHomeUiState())
    val state: StateFlow<RequesterHomeUiState> = _state.asStateFlow()
}

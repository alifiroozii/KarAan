package com.karvin.app.feature.map

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.FilterAlt
import androidx.compose.material.icons.automirrored.filled.FormatListBulleted
import androidx.compose.material.icons.filled.FormatPaint
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Radar
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SearchOff
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.Work
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavHostController
import com.google.android.gms.maps.CameraUpdateFactory
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
import com.google.maps.android.compose.MapEffect
import com.karvin.app.core.designsystem.KarvinHomeScaffold
import com.karvin.app.core.designsystem.InteractiveStreetMapView
import com.karvin.app.core.designsystem.KarjoorColors
import com.karvin.app.core.designsystem.OnlinePill
import com.karvin.app.core.designsystem.PrimaryButton
import com.karvin.app.core.designsystem.RatingLine
import com.karvin.app.core.designsystem.SmartRadarMapView
import com.karvin.app.core.designsystem.RadarMarkerItem
import com.karvin.app.core.designsystem.MapMarkerType
import com.karvin.app.domain.model.toTomanString
import com.karvin.app.domain.model.toRatingString
import com.karvin.app.domain.model.toShortToman
import androidx.compose.material.icons.filled.Verified
import com.karvin.app.core.location.LocationResult
import com.karvin.app.core.location.LocationTracker
import com.karvin.app.core.navigation.Routes
import com.karvin.app.data.FakeData
import com.karvin.app.data.FakeNearbyData
import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.NearbyProvider
import com.karvin.app.domain.model.NearbyServiceRequest
import com.karvin.app.domain.model.RequesterMapFilter
import com.karvin.app.domain.model.toPersianDigits
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.filled.Phone
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

// ──────────────────────── ViewModel ────────────────────────

enum class MapEntityFilter(val label: String) {
    ALL("همه"),
    PROVIDERS("متخصصین"),
    REQUESTS("فرصت‌های کاری"),
}

data class RequesterMapUiState(
    val providers: List<NearbyProvider> = emptyList(),
    val requests: List<NearbyServiceRequest> = emptyList(),
    val filteredProviders: List<NearbyProvider> = emptyList(),
    val filteredRequests: List<NearbyServiceRequest> = emptyList(),
    val entityFilter: MapEntityFilter = MapEntityFilter.ALL,
    val filter: RequesterMapFilter = RequesterMapFilter(),
    val userPoint: GeoPoint = GeoPoint(35.7730, 51.3700), // سعادت‌آباد
    val selectedProvider: NearbyProvider? = null,
    val selectedRequest: NearbyServiceRequest? = null,
    val loading: Boolean = true,
    val isLocating: Boolean = false,
    val gpsActive: Boolean = false,
    val radarMode: Boolean = true,
)

@HiltViewModel
class RequesterMapViewModel @Inject constructor(
    private val locationTracker: LocationTracker,
) : ViewModel() {
    private val _state = MutableStateFlow(RequesterMapUiState())
    val state: StateFlow<RequesterMapUiState> = _state.asStateFlow()

    init {
        loadData()
        refreshLocation()
    }

    private fun loadData() {
        viewModelScope.launch {
            try {
                val remoteJobs = com.karvin.app.core.network.MobileDashboardSync.fetchRemoteJobs()
                val realRequests = remoteJobs.map { job ->
                    NearbyServiceRequest(
                        id = job.id,
                        title = job.title,
                        category = job.category,
                        description = job.description,
                        budget = job.amount,
                        budgetLabel = "${job.amount} تومان",
                        point = job.point,
                        createdAt = job.date.toString(),
                        isUrgent = job.isUrgent,
                        requesterRating = 5.0,
                        scheduledTime = "${job.date} ${job.startTime}",
                        approximateAddress = job.address,
                        requesterName = job.employer.name,
                    )
                }
                _state.update { state ->
                    state.copy(
                        providers = emptyList(),
                        filteredProviders = emptyList(),
                        requests = realRequests,
                        filteredRequests = filterRequests(realRequests, state.userPoint, state.filter),
                        loading = false,
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false) }
            }
        }
    }

    fun refreshLocation(onMoved: ((GeoPoint) -> Unit)? = null) {
        _state.update { it.copy(isLocating = true) }
        locationTracker.refresh { result ->
            when (result) {
                is LocationResult.Available -> {
                    val point = result.point
                    viewModelScope.launch {
                        val remoteJobs = com.karvin.app.core.network.MobileDashboardSync.fetchRemoteJobs()
                        val realRequests = remoteJobs.map { job ->
                            NearbyServiceRequest(
                                id = job.id,
                                title = job.title,
                                category = job.category,
                                description = job.description,
                                budget = job.amount,
                                budgetLabel = "${job.amount} تومان",
                                point = job.point,
                                createdAt = job.date.toString(),
                                isUrgent = job.isUrgent,
                                requesterRating = 5.0,
                                scheduledTime = "${job.date} ${job.startTime}",
                                approximateAddress = job.address,
                                requesterName = job.employer.name,
                            )
                        }
                        _state.update { state ->
                            state.copy(
                                userPoint = point,
                                providers = emptyList(),
                                filteredProviders = emptyList(),
                                requests = realRequests,
                                filteredRequests = filterRequests(realRequests, point, state.filter),
                                isLocating = false,
                                gpsActive = true,
                                loading = false,
                            )
                        }
                        onMoved?.invoke(point)
                    }
                }
                is LocationResult.Failed -> {
                    _state.update { it.copy(isLocating = false) }
                }
            }
        }
    }

    fun updateFilter(filter: RequesterMapFilter) {
        _state.update { state ->
            state.copy(
                filter = filter,
                filteredProviders = filterProviders(state.providers, state.userPoint, filter),
                filteredRequests = filterRequests(state.requests, state.userPoint, filter),
            )
        }
    }

    fun setEntityFilter(entityFilter: MapEntityFilter) {
        _state.update { it.copy(entityFilter = entityFilter) }
    }

    fun toggleRadarMode() {
        _state.update { it.copy(radarMode = !it.radarMode) }
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

    private fun filterRequests(
        requests: List<NearbyServiceRequest>,
        userPoint: GeoPoint,
        filter: RequesterMapFilter,
    ): List<NearbyServiceRequest> = requests.filter { req ->
        val queryMatch = filter.query.isBlank() ||
            req.title.contains(filter.query, ignoreCase = true) ||
            req.category.title.contains(filter.query, ignoreCase = true)
        val categoryMatch = filter.categoryId == null || req.category.id == filter.categoryId
        val distanceMatch = filter.distanceFilter == DistanceFilter.ALL ||
            DistanceCalculator.matches(
                DistanceCalculator.distanceInKm(userPoint, req.point),
                filter.distanceFilter,
            )
        queryMatch && categoryMatch && distanceMatch
    }

    fun selectProvider(provider: NearbyProvider?) {
        _state.update { it.copy(selectedProvider = provider, selectedRequest = null) }
    }

    fun selectRequest(request: NearbyServiceRequest?) {
        _state.update { it.copy(selectedRequest = request, selectedProvider = null) }
    }

    fun searchAround(center: GeoPoint) {
        viewModelScope.launch {
            try {
                val remoteJobs = com.karvin.app.core.network.MobileDashboardSync.fetchRemoteJobs()
                val realRequests = remoteJobs.map { job ->
                    NearbyServiceRequest(
                        id = job.id,
                        title = job.title,
                        category = job.category,
                        description = job.description,
                        budget = job.amount,
                        budgetLabel = "${job.amount} تومان",
                        point = job.point,
                        createdAt = job.date.toString(),
                        isUrgent = job.isUrgent,
                        requesterRating = 5.0,
                        scheduledTime = "${job.date} ${job.startTime}",
                        approximateAddress = job.address,
                        requesterName = job.employer.name,
                    )
                }
                _state.update {
                    it.copy(
                        userPoint = center,
                        providers = emptyList(),
                        filteredProviders = emptyList(),
                        requests = realRequests,
                        filteredRequests = filterRequests(realRequests, center, it.filter),
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(userPoint = center) }
            }
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
    var showMapKeyWarning by remember { mutableStateOf(false) }
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(
            LatLng(state.userPoint.latitude, state.userPoint.longitude),
            14f,
        )
    }

    val scope = rememberCoroutineScope()
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions.values.any { it }) {
            viewModel.refreshLocation { point ->
                scope.launch {
                    cameraPositionState.animate(
                        CameraUpdateFactory.newLatLngZoom(LatLng(point.latitude, point.longitude), 14.5f)
                    )
                }
            }
        }
    }

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
                                Icon(Icons.Default.SearchOff, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(48.dp))
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
            // Modern High-Fidelity Google Stitch Interactive Street Map (Specialists & Jobs)
            val radarMarkers = remember(state.filteredProviders, state.filteredRequests, state.entityFilter) {
                val provMarkers = if (state.entityFilter == MapEntityFilter.REQUESTS) emptyList() else {
                    state.filteredProviders.map { p ->
                        RadarMarkerItem(
                            id = "provider_${p.id}",
                            title = p.name,
                            subtitle = "${p.primarySkill} • ${p.responseTime}",
                            point = p.point,
                            isUrgent = false,
                            isVerified = p.isVerified,
                            badgeLabel = "★${p.rating.toRatingString()}",
                            initial = p.name.take(1),
                            priceLabel = "از ${p.basePrice.toTomanString()}",
                            category = p.primarySkill,
                            type = MapMarkerType.PERFORMER,
                            rating = p.rating,
                        )
                    }
                }
                val reqMarkers = if (state.entityFilter == MapEntityFilter.PROVIDERS) emptyList() else {
                    state.filteredRequests.map { req ->
                        RadarMarkerItem(
                            id = "request_${req.id}",
                            title = req.title,
                            subtitle = "${req.category.title} • ${req.approximateAddress}",
                            point = req.point,
                            isUrgent = req.isUrgent,
                            isVerified = false,
                            badgeLabel = req.budgetLabel,
                            initial = req.title.take(1),
                            priceLabel = req.budgetLabel,
                            category = req.category.title,
                            type = MapMarkerType.JOB,
                            rating = req.requesterRating,
                        )
                    }
                }
                provMarkers + reqMarkers
            }

            val selectedMarkerId = when {
                state.selectedProvider != null -> "provider_${state.selectedProvider?.id}"
                state.selectedRequest != null -> "request_${state.selectedRequest?.id}"
                else -> null
            }

            InteractiveStreetMapView(
                centerPoint = state.userPoint,
                userPoint = state.userPoint,
                markers = radarMarkers,
                selectedMarkerId = selectedMarkerId,
                isLocating = state.isLocating,
                initialZoom = 14.5f,
                showRadarRings = state.radarMode,
                onMarkerClick = { marker ->
                    if (marker.type == MapMarkerType.PERFORMER) {
                        val rawId = marker.id.removePrefix("provider_")
                        val prov = state.filteredProviders.firstOrNull { it.id == rawId }
                        viewModel.selectProvider(prov)
                    } else {
                        val rawId = marker.id.removePrefix("request_")
                        val req = state.filteredRequests.firstOrNull { it.id == rawId }
                        viewModel.selectRequest(req)
                    }
                },
                onMyLocationClick = {
                    viewModel.refreshLocation { point ->
                        scope.launch {
                            cameraPositionState.animate(
                                CameraUpdateFactory.newLatLngZoom(LatLng(point.latitude, point.longitude), 14.5f)
                            )
                        }
                    }
                },
            )
        }

        // Floating Top Header (Google Stitch Minimalist 3-Tier Design)
        Column(
            Modifier
                .fillMaxWidth()
                .padding(top = 10.dp, start = 14.dp, end = 14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // Tier 1: Search input + Mic/Filter button + Map/List toggle (Google Stitch 781b)
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = state.filter.query,
                    onValueChange = { viewModel.updateFilter(state.filter.copy(query = it)) },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("جستجوی خدمت، تخصص یا کارشناس...", fontSize = 12.sp) },
                    singleLine = true,
                    leadingIcon = {
                        Box(
                            modifier = Modifier
                                .padding(start = 6.dp)
                                .size(32.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                Icons.Default.Search,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    },
                    trailingIcon = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(end = 4.dp),
                        ) {
                            IconButton(
                                onClick = { showFilters = true },
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        if (state.filter != RequesterMapFilter()) MaterialTheme.colorScheme.primaryContainer
                                        else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f),
                                    ),
                            ) {
                                Box {
                                    Icon(
                                        Icons.Default.Tune,
                                        contentDescription = "فیلترها",
                                        tint = if (state.filter != RequesterMapFilter()) MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(17.dp),
                                    )
                                    if (state.filter != RequesterMapFilter()) {
                                        Box(
                                            modifier = Modifier
                                                .size(7.dp)
                                                .clip(CircleShape)
                                                .background(MaterialTheme.colorScheme.error)
                                                .align(Alignment.TopEnd)
                                        )
                                    }
                                }
                            }
                        }
                    },
                    shape = RoundedCornerShape(20.dp),
                    colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                        unfocusedContainerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                    ),
                )

                // List / Map Toggle Button (Stitch Pill Style)
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                    shadowElevation = 3.dp,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                    modifier = Modifier.clip(RoundedCornerShape(16.dp)).clickable { listMode = !listMode },
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 11.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Icon(
                            if (listMode) Icons.Default.Map else Icons.AutoMirrored.Filled.FormatListBulleted,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(17.dp)
                        )
                        Text(
                            if (listMode) "نقشه" else "فهرست",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
            }

            // Tier 2: Category Filter Pills (Google Stitch 781b - Horizontal Scrolling Capsule Carousel)
            Row(
                Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // "همه" Active Pill
                val isAllSelected = state.filter.categoryId == null
                Surface(
                    shape = RoundedCornerShape(9999.dp),
                    color = if (isAllSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                    shadowElevation = if (isAllSelected) 3.dp else 1.dp,
                    border = BorderStroke(
                        1.dp,
                        if (isAllSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)
                    ),
                    modifier = Modifier.clip(RoundedCornerShape(9999.dp)).clickable {
                        viewModel.updateFilter(state.filter.copy(categoryId = null))
                    }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 13.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp),
                    ) {
                        Icon(
                            Icons.Default.Apps,
                            contentDescription = null,
                            tint = if (isAllSelected) Color.White else MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(15.dp)
                        )
                        Text(
                            text = "همه (${state.providers.size.toString().toPersianDigits()})",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = if (isAllSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }

                categories.forEach { category ->
                    val isSelected = state.filter.categoryId == category.id
                    val (vectorIcon, iconColor) = when {
                        category.title.contains("برق") -> Pair(Icons.Default.Bolt, Color(0xFFF59E0B))
                        category.title.contains("پکیج") || category.title.contains("تعمیر") -> Pair(Icons.Default.Build, Color(0xFF0284C7))
                        category.title.contains("لوله") -> Pair(Icons.Default.Build, Color(0xFF0284C7))
                        category.title.contains("نظافت") -> Pair(Icons.Default.CleaningServices, Color(0xFF10B981))
                        category.title.contains("نقاش") -> Pair(Icons.Default.FormatPaint, Color(0xFF8B5CF6))
                        category.title.contains("بار") || category.title.contains("حمل") -> Pair(Icons.Default.LocalShipping, Color(0xFFF97316))
                        else -> Pair(Icons.Default.Work, MaterialTheme.colorScheme.primary)
                    }
                    val count = state.providers.count { p ->
                        p.primarySkill.contains(category.title) || p.skills.any { it.contains(category.title) }
                    }.takeIf { it > 0 } ?: 6

                    Surface(
                        shape = RoundedCornerShape(9999.dp),
                        color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                        shadowElevation = if (isSelected) 3.dp else 1.dp,
                        border = BorderStroke(
                            1.dp,
                            if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)
                        ),
                        modifier = Modifier.clip(RoundedCornerShape(9999.dp)).clickable {
                            viewModel.updateFilter(state.filter.copy(categoryId = if (isSelected) null else category.id))
                        }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp),
                        ) {
                            Icon(
                                vectorIcon,
                                contentDescription = null,
                                tint = if (isSelected) Color.White else iconColor,
                                modifier = Modifier.size(15.dp)
                            )
                            Text(
                                text = "${category.title} (${count.toString().toPersianDigits()})",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    }
                }
            }

            // Tier 3: Sleek Unified Role Context & Live Radar Pill (Google Stitch 781b)
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                shadowElevation = 4.dp,
                border = BorderStroke(0.8.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    // Left: Role Context & Specialist Count
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(KarjoorColors.Success)
                        )
                        Text(
                            text = "نقش: کارفرما",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary,
                        )
                        Text("•", color = MaterialTheme.colorScheme.outlineVariant)
                        Text(
                            text = "${state.filteredProviders.size.toString().toPersianDigits()} متخصص آماده",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Text(
                            text = "(${state.filter.distanceFilter.label})",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 10.sp,
                        )
                    }

                    // Right: Live Radar / City Map Toggle
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (state.radarMode) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f),
                        modifier = Modifier.clip(RoundedCornerShape(10.dp)).clickable { viewModel.toggleRadarMode() }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Icon(
                                if (state.radarMode) Icons.Default.Radar else Icons.Default.Map,
                                contentDescription = null,
                                tint = if (state.radarMode) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = if (state.radarMode) "رادار زنده" else "نقشه ساده",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = if (state.radarMode) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
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

    // Job Request bottom sheet
    state.selectedRequest?.let { request ->
        RequesterJobBottomSheet(
            request = request,
            onDismiss = { viewModel.selectRequest(null) },
            onViewDetails = {
                viewModel.selectRequest(null)
                navController.navigate(Routes.jobDetails(request.id, employerMode = false))
            },
            onChat = {
                viewModel.selectRequest(null)
                navController.navigate(Routes.Chat)
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

@OptIn(com.google.maps.android.compose.MapsComposeExperimentalApi::class)
@Composable
private fun BoxScope.RequesterGoogleMap(
    state: RequesterMapUiState,
    onMapReady: (Boolean) -> Unit,
    cameraPositionState: CameraPositionState,
    onProviderClick: (NearbyProvider) -> Unit,
    onMyLocation: () -> Unit,
    onSearchThisArea: () -> Unit,
) {
    GoogleMap(
        Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState,
        properties = MapProperties(isMyLocationEnabled = false),
        uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = false, compassEnabled = true, mapToolbarEnabled = false),
    ) {
        MapEffect(Unit) { googleMap ->
            onMapReady(com.karvin.app.BuildConfig.MAPS_API_KEY.isNotBlank())
            googleMap.uiSettings.isRotateGesturesEnabled = false
            googleMap.uiSettings.isTiltGesturesEnabled = false
        }
        state.filter.distanceFilter.maxKm?.let { radiusKm ->
            Circle(
                center = LatLng(state.userPoint.latitude, state.userPoint.longitude),
                radius = radiusKm * 1000.0,
                strokeColor = MaterialTheme.colorScheme.primary,
                strokeWidth = 3f,
                fillColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f),
            )
        }
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
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
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
                    fontWeight = FontWeight.Bold,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(provider.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
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
                    "${provider.basePrice.toString().toPersianDigits()} تومان",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }
}

// ──────────────────────── Provider Bottom Sheet ────────────────────────

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
internal fun ProviderBottomSheet(
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
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Box {
                    Box(
                        Modifier
                            .size(66.dp)
                            .clip(RoundedCornerShape(18.dp))
                            .background(KarjoorColors.Secondary.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            provider.name.take(1),
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = KarjoorColors.Secondary,
                        )
                    }
                    if (provider.isVerified) {
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFF10B981),
                            border = BorderStroke(2.dp, Color.White),
                            modifier = Modifier
                                .size(22.dp)
                                .align(Alignment.BottomEnd),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.CheckCircle,
                                    contentDescription = "تایید شده",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp),
                                )
                            }
                        }
                    }
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(provider.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = Color(0xFFECFDF5),
                            border = BorderStroke(0.8.dp, Color(0xFFA7F3D0)),
                        ) {
                            Text(
                                "تایید اتحادیه",
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                color = Color(0xFF047857),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                    Text(
                        "تکنسین ارشد ${provider.primarySkill} • کد ${100 + provider.reviewCount}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        RatingLine(provider.rating, provider.reviewCount)
                        Text("•", color = MaterialTheme.colorScheme.outlineVariant)
                        Text("زمان اعزام: ${provider.responseTime}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }

            // Approved Price Box (matching Stitch design)
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(
                        "دستمزد مصوب کارجور",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        "${provider.basePrice.toTomanString()} (ساعتی)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }

            // Escrow Guarantee Banner (matching Stitch design)
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = Color(0xFFF0FDF4),
                border = BorderStroke(1.dp, Color(0xFF86EFAC)),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(
                        Icons.Default.Verified,
                        contentDescription = null,
                        tint = Color(0xFF16A34A),
                        modifier = Modifier.size(24.dp),
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            "ضمانت پرداخت امن کارجور (Escrow)",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF15803D),
                        )
                        Text(
                            "تسویه آنی با متخصص صرفاً پس از تایید و رضایت شما از حسن انجام کار",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF166534),
                        )
                    }
                }
            }

            // Stats row
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatChip("امتیاز", provider.rating.toRatingString(), Modifier.weight(1f))
                StatChip("نظر", provider.reviewCount.toString().toPersianDigits(), Modifier.weight(1f))
                StatChip("فاصله", DistanceCalculator.format(distance), Modifier.weight(1f))
                StatChip("کار موفق", provider.completedJobs.toString().toPersianDigits(), Modifier.weight(1f))
            }

            // Skills
            Text("خدمات و تخصص‌ها", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            @OptIn(ExperimentalLayoutApi::class)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                provider.skills.forEach { skill ->
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        Text(skill, Modifier.padding(horizontal = 10.dp, vertical = 6.dp), style = MaterialTheme.typography.labelMedium)
                    }
                }
            }

            // Buttons
            PrimaryButton(
                "درخواست سریع اعزام",
                onRequest,
                Modifier.fillMaxWidth(),
            )

            OutlinedButton(
                onClick = onViewProfile,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(14.dp),
            ) { Text("مشاهده سوابق و نظرات") }
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

// ──────────────────────── Job Request Bottom Sheet ────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RequesterJobBottomSheet(
    request: NearbyServiceRequest,
    onDismiss: () -> Unit,
    onViewDetails: () -> Unit,
    onChat: () -> Unit,
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
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Box(Modifier.size(54.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = when {
                                request.title.contains("برق") -> "⚡"
                                request.title.contains("کولر") || request.title.contains("پکیج") -> "❄️"
                                request.title.contains("لوله") -> "🔧"
                                request.title.contains("سینک") -> "🚿"
                                request.title.contains("نظافت") -> "🧹"
                                request.title.contains("نقاش") -> "🎨"
                                request.title.contains("انبار") || request.title.contains("اسباب") -> "📦"
                                else -> "💼"
                            },
                            fontSize = 24.sp,
                        )
                    }
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(request.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        if (request.isUrgent) {
                            Surface(color = KarjoorColors.AccentCoral, shape = RoundedCornerShape(6.dp)) {
                                Text("فوری", Modifier.padding(horizontal = 6.dp, vertical = 2.dp), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    Text("دسته‌بندی: ${request.category.title} • ثبت شده ${request.createdAt}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // Info rows
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatChip("بودجه مصوب", request.budgetLabel, Modifier.weight(1f))
                StatChip("زمان اجرا", request.scheduledTime, Modifier.weight(1f))
                StatChip("محل کار", request.approximateAddress.takeLast(12), Modifier.weight(1f))
            }

            // Description
            Text("شرح درخواست کارفرما", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Text(
                request.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 22.sp,
            )

            // Requester info
            Row(
                Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(12.dp)).padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Box(Modifier.size(36.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer), contentAlignment = Alignment.Center) {
                    Text(request.requesterName.take(1), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
                Column(Modifier.weight(1f)) {
                    Text(request.requesterName, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                    Text("کارفرمای تایید شده • ${request.requesterRating.toRatingString()} ★", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                IconButton(onClick = onChat) {
                    Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = "چت", tint = MaterialTheme.colorScheme.primary)
                }
            }

            // Escrow Guarantee Banner
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFFF0FDF4),
                border = BorderStroke(1.dp, Color(0xFFBBF7D0)),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF16A34A), modifier = Modifier.size(18.dp))
                    Text(
                        "🛡️ مبلغ بودجه در حساب امانی کارجور (Escrow) سپرده شده است و پس از تایید نهایی آزاد می‌گردد.",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF15803D),
                        fontWeight = FontWeight.Medium,
                    )
                }
            }

            // Action Buttons
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PrimaryButton(
                    text = "مشاهده جزئیات کامل و همکاری",
                    onClick = onViewDetails,
                    modifier = Modifier.weight(1f),
                )
                OutlinedButton(
                    onClick = onChat,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.size(48.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp),
                ) {
                    Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = "چت", tint = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }
}


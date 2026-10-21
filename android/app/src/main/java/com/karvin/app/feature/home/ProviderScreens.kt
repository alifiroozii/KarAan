package com.karvin.app.feature.home

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.FormatPaint
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SearchOff
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Yard
import androidx.compose.material.icons.outlined.ChatBubbleOutline
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
import com.google.maps.android.compose.MapEffect
import androidx.compose.runtime.rememberCoroutineScope
import com.google.android.gms.maps.CameraUpdateFactory
import com.karvin.app.core.designsystem.SmartRadarMapView
import com.karvin.app.core.designsystem.InteractiveStreetMapView
import com.karvin.app.core.designsystem.KarjoorColors
import com.karvin.app.core.designsystem.RadarMarkerItem
import com.karvin.app.core.designsystem.MapMarkerType
import com.karvin.app.domain.model.toTomanString
import com.karvin.app.domain.model.toRatingString
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.FilterAlt
import androidx.compose.material.icons.filled.Search
import com.karvin.app.core.location.LocationResult
import com.karvin.app.core.location.LocationTracker
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.Avatar
import com.karvin.app.core.designsystem.KarvinFab
import com.karvin.app.core.designsystem.KarvinHomeScaffold
import com.karvin.app.core.designsystem.KarvinLogo
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
import com.karvin.app.domain.model.NearbyServiceRequest
import com.karvin.app.domain.model.ProviderMapFilter
import com.karvin.app.domain.model.toPersianDigits
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
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
    val providers: List<NearbyProvider> = emptyList(),
    val filteredRequests: List<NearbyServiceRequest> = emptyList(),
    val filteredProviders: List<NearbyProvider> = emptyList(),
    val entityFilter: com.karvin.app.feature.map.MapEntityFilter = com.karvin.app.feature.map.MapEntityFilter.ALL,
    val filter: ProviderMapFilter = ProviderMapFilter(),
    val userPoint: GeoPoint = GeoPoint(35.7730, 51.3700),
    val selectedRequest: NearbyServiceRequest? = null,
    val selectedProvider: NearbyProvider? = null,
    val isAvailable: Boolean = false,
    val loading: Boolean = true,
    val isLocating: Boolean = false,
    val gpsActive: Boolean = false,
    val radarMode: Boolean = true,
)

@HiltViewModel
class ProviderHomeViewModel @Inject constructor(
    private val locationTracker: LocationTracker,
) : ViewModel() {
    private val _homeState = MutableStateFlow(ProviderHomeUiState())
    val homeState: StateFlow<ProviderHomeUiState> = _homeState.asStateFlow()

    private val _mapState = MutableStateFlow(ProviderMapUiState())
    val mapState: StateFlow<ProviderMapUiState> = _mapState.asStateFlow()

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
                _homeState.update { it.copy(requests = realRequests, nearbyCount = realRequests.size) }
                _mapState.update {
                    it.copy(
                        requests = realRequests,
                        filteredRequests = realRequests,
                        providers = emptyList(),
                        filteredProviders = emptyList(),
                        loading = false,
                    )
                }
            } catch (e: Exception) {
                _mapState.update { it.copy(loading = false) }
            }
        }
    }

    fun refreshLocation(onMoved: ((GeoPoint) -> Unit)? = null) {
        _mapState.update { it.copy(isLocating = true) }
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
                        _mapState.update { state ->
                            state.copy(
                                userPoint = point,
                                requests = realRequests,
                                filteredRequests = filterRequests(realRequests, point, state.filter),
                                providers = emptyList(),
                                filteredProviders = emptyList(),
                                isLocating = false,
                                gpsActive = true,
                                loading = false,
                            )
                        }
                        _homeState.update { it.copy(requests = realRequests, nearbyCount = realRequests.size) }
                        onMoved?.invoke(point)
                    }
                }
                is LocationResult.Failed -> {
                    _mapState.update { it.copy(isLocating = false) }
                }
            }
        }
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

    fun setEntityFilter(entityFilter: com.karvin.app.feature.map.MapEntityFilter) {
        _mapState.update { it.copy(entityFilter = entityFilter) }
    }

    fun toggleRadarMode() {
        _mapState.update { it.copy(radarMode = !it.radarMode) }
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
        _mapState.update { it.copy(selectedRequest = request, selectedProvider = null) }
    }

    fun selectProvider(provider: NearbyProvider?) {
        _mapState.update { it.copy(selectedProvider = provider, selectedRequest = null) }
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
                _mapState.update {
                    it.copy(
                        userPoint = center,
                        requests = realRequests,
                        filteredRequests = filterRequests(realRequests, center, it.filter),
                        providers = emptyList(),
                        filteredProviders = emptyList(),
                    )
                }
                _homeState.update { it.copy(requests = realRequests, nearbyCount = realRequests.size) }
            } catch (e: Exception) {
                _mapState.update { it.copy(userPoint = center) }
            }
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
                        Icon(Icons.Default.Notifications, contentDescription = "اعلان‌ها", tint = MaterialTheme.colorScheme.primary)
                    }
                })
            }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text("سلام", style = MaterialTheme.typography.headlineSmall)
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

        // Active Job Stepper Tracking Card
        item {
            ActiveJobStepperCard(navController = navController)
        }

        // Weekly Earnings Chart Card
        item {
            WeeklyEarningsChart()
        }

        // Nearby requests header
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("درخواست‌های نزدیک", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                TextButton(onClick = { navController.navigate(Routes.ProviderMap) }) {
                    Text("مشاهده روی نقشه", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // Nearby request cards
        items(state.requests.take(5), key = { it.id }) { request ->
            Card(
                onClick = { navController.navigate(Routes.ProviderMap) },
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            ) {
                Row(
                    Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = if (request.isUrgent) MaterialTheme.colorScheme.secondaryContainer
                        else MaterialTheme.colorScheme.primaryContainer,
                    ) {
                        Text(
                            request.title.take(1),
                            Modifier.padding(12.dp),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = if (request.isUrgent) MaterialTheme.colorScheme.onSecondaryContainer
                            else MaterialTheme.colorScheme.primary,
                        )
                    }
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(request.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
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
                        Text(request.budgetLabel, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
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
private fun ActiveJobStepperCard(navController: NavHostController) {
    var activeStep by remember { mutableStateOf(1) } // 0: accepted, 1: on the way, 2: arrived, 3: completed
    val steps = listOf("پذیرش", "در مسیر", "رسیدن", "اتمام")

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("سفارش فعال جاری", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text("تعمیر جعبه فیوز · سعادت‌آباد", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Surface(color = MaterialTheme.colorScheme.primaryContainer, shape = RoundedCornerShape(8.dp)) {
                    Text("۳۵۰,۰۰۰ تومان", modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
            }

            // Stepper progress indicator
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                steps.forEachIndexed { index, title ->
                    val isDone = index <= activeStep
                    val isCurrent = index == activeStep
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(if (isDone) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center,
                        ) {
                            if (isDone && index < activeStep) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            } else {
                                Text((index + 1).toString().toPersianDigits(), color = if (isDone) Color.White else MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                            }
                        }
                        Text(title, style = MaterialTheme.typography.labelSmall, color = if (isCurrent) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal)
                    }
                    if (index < steps.size - 1) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(2.dp)
                                .padding(horizontal = 4.dp)
                                .background(if (index < activeStep) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant),
                        )
                    }
                }
            }

            // Action button for next step
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { if (activeStep < 3) activeStep++ else activeStep = 0 },
                    modifier = Modifier.weight(1f).height(44.dp),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Text(
                        when (activeStep) {
                            0 -> "🚗 اعلام حرکت (در مسیر)"
                            1 -> "📍 رسیدن به محل کارفرما"
                            2 -> "⚙️ پایان کار و دریافت دستمزد"
                            else -> "✅ کار تکمیل شد (شروع مجدد)"
                        },
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
                IconButton(onClick = { navController.navigate(Routes.Chat) }) {
                    Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = "چت با کارفرما", tint = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }
}

@Composable
private fun WeeklyEarningsChart() {
    val days = listOf("ش", "ی", "د", "س", "چ", "پ", "ج")
    val values = listOf(450, 680, 520, 850, 920, 1100, 300) // in thousands Toman
    val maxVal = values.maxOrNull() ?: 1000

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("درآمد این هفته", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                    Text("مجموع: ۴,۸۲۰,۰۰۰ تومان", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
                Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = RoundedCornerShape(8.dp)) {
                    Text("+۲۴٪ رشد", modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondaryContainer)
                }
            }

            // Interactive Bar Chart
            Row(
                Modifier.fillMaxWidth().height(100.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom,
            ) {
                days.forEachIndexed { index, day ->
                    val value = values[index]
                    val heightFraction = value.toFloat() / maxVal.toFloat()
                    val isPeak = value == maxVal

                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Bottom, modifier = Modifier.weight(1f)) {
                        Box(
                            modifier = Modifier
                                .width(22.dp)
                                .height((80 * heightFraction).dp)
                                .clip(RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp))
                                .background(if (isPeak) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.primaryContainer),
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(day, style = MaterialTheme.typography.labelSmall, color = if (isPeak) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = if (isPeak) FontWeight.Bold else FontWeight.Normal)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatBox(value: Int, label: String, modifier: Modifier) {
    Card(
        modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(
            Modifier.padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(value.toString().toPersianDigits(), style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
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
    var showMapKeyWarning by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
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
                                Icon(Icons.Default.SearchOff, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(48.dp))
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
            // Modern High-Fidelity Google Stitch Interactive Street Map for Performers (Jobs & Colleagues)
            val radarMarkers = remember(state.filteredRequests, state.filteredProviders, state.entityFilter) {
                val reqMarkers = if (state.entityFilter == com.karvin.app.feature.map.MapEntityFilter.PROVIDERS) emptyList() else {
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
                val provMarkers = if (state.entityFilter == com.karvin.app.feature.map.MapEntityFilter.REQUESTS) emptyList() else {
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
                reqMarkers + provMarkers
            }

            val selectedMarkerId = when {
                state.selectedRequest != null -> "request_${state.selectedRequest?.id}"
                state.selectedProvider != null -> "provider_${state.selectedProvider?.id}"
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
                    if (marker.type == MapMarkerType.JOB) {
                        val rawId = marker.id.removePrefix("request_")
                        val req = state.filteredRequests.firstOrNull { it.id == rawId }
                        viewModel.selectRequest(req)
                    } else {
                        val rawId = marker.id.removePrefix("provider_")
                        val prov = state.filteredProviders.firstOrNull { it.id == rawId }
                        viewModel.selectProvider(prov)
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

        // Floating Top Header (Search, Categories, Stitch Stats Pill, List/Map toggle)
        Column(
            Modifier
                .fillMaxWidth()
                .padding(top = 10.dp, start = 14.dp, end = 14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // Row 1: Search Input + Filter button + Map/List toggle
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = state.filter.query,
                    onValueChange = { viewModel.updateFilter(state.filter.copy(query = it)) },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("جستجو در فرصت‌های کاری و همکاران...", fontSize = 13.sp) },
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = MaterialTheme.colorScheme.primary) },
                    shape = RoundedCornerShape(20.dp),
                    colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                        unfocusedContainerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                    ),
                )

                // List / Map Toggle Button
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                    shadowElevation = 4.dp,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                    modifier = Modifier.clip(RoundedCornerShape(16.dp)).clickable { listMode = !listMode },
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Text(if (listMode) "🗺️" else "📋", fontSize = 14.sp)
                        Text(
                            if (listMode) "نقشه" else "لیست",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }

            // Row 2: Entity Filter Pills (همه / فرصت‌های کاری / همکاران) + Radar Toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Entity Segmented Controls
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                    shadowElevation = 3.dp,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                    modifier = Modifier.weight(1f),
                ) {
                    Row(
                        modifier = Modifier.padding(3.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        listOf(
                            Triple(com.karvin.app.feature.map.MapEntityFilter.ALL, "🌟 همه", (state.requests.size + state.providers.size)),
                            Triple(com.karvin.app.feature.map.MapEntityFilter.REQUESTS, "💼 کارها", state.requests.size),
                            Triple(com.karvin.app.feature.map.MapEntityFilter.PROVIDERS, "👨‍🔧 همکاران", state.providers.size),
                        ).forEach { (f, label, count) ->
                            val isSel = state.entityFilter == f
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isSel) MaterialTheme.colorScheme.primary else Color.Transparent)
                                    .clickable { viewModel.setEntityFilter(f) }
                                    .padding(vertical = 6.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = "$label (${count.toString().toPersianDigits()})",
                                    fontSize = 11.sp,
                                    fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSel) Color.White else MaterialTheme.colorScheme.onSurface,
                                )
                            }
                        }
                    }
                }

                // Radar Toggle Button
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = if (state.radarMode) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                    shadowElevation = 3.dp,
                    border = BorderStroke(1.dp, if (state.radarMode) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .clickable { viewModel.toggleRadarMode() },
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Text(if (state.radarMode) "📡" else "🗺️", fontSize = 13.sp)
                        Text(
                            text = if (state.radarMode) "رادار زنده" else "نقشه ساده",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (state.radarMode) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
            }

            // Row 3: Category chips
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FilterChip(
                    selected = state.filter.categoryId == null,
                    onClick = { viewModel.updateFilter(state.filter.copy(categoryId = null)) },
                    label = { Text("همه دسته‌ها", fontWeight = FontWeight.Bold) },
                    shape = RoundedCornerShape(14.dp),
                )
                categories.forEach { category ->
                    val isSelected = state.filter.categoryId == category.id
                    val icon = when {
                        category.title.contains("برق") -> "⚡"
                        category.title.contains("پکیج") || category.title.contains("تعمیر") -> "❄️"
                        category.title.contains("لوله") -> "🔧"
                        category.title.contains("نظافت") -> "🧹"
                        category.title.contains("نقاش") -> "🎨"
                        else -> "💼"
                    }
                    FilterChip(
                        selected = isSelected,
                        onClick = { viewModel.updateFilter(state.filter.copy(categoryId = if (isSelected) null else category.id)) },
                        label = { Text("$icon ${category.title}") },
                        shape = RoundedCornerShape(14.dp),
                    )
                }
            }

            // Row 4: Floating Status Pill (matching Stitch 7cb59bda)
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
                shadowElevation = 3.dp,
                border = BorderStroke(0.8.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
                modifier = Modifier.align(Alignment.CenterHorizontally),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(KarjoorColors.Secondary),
                    )
                    Text(
                        text = "شعاع: ${state.filter.distanceFilter.label}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text("•", color = MaterialTheme.colorScheme.outlineVariant, fontSize = 10.sp)
                    Text(
                        text = "${state.filteredRequests.size.toString().toPersianDigits()} فرصت کاری و ${state.filteredProviders.size.toString().toPersianDigits()} همکار در محدوده شما",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
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

    // Colleague/Provider bottom sheet
    state.selectedProvider?.let { provider ->
        com.karvin.app.feature.map.ProviderBottomSheet(
            provider = provider,
            userPoint = state.userPoint,
            onDismiss = { viewModel.selectProvider(null) },
            onViewProfile = {
                viewModel.selectProvider(null)
                navController.navigate(Routes.providerProfile(provider.id))
            },
            onRequest = {
                viewModel.selectProvider(null)
                navController.navigate(Routes.Chat)
            },
        )
    }
}

// ──────────────────────── Provider Google Map ────────────────────────

@OptIn(com.google.maps.android.compose.MapsComposeExperimentalApi::class)
@Composable
private fun BoxScope.ProviderGoogleMap(
    state: ProviderMapUiState,
    onMapReady: (Boolean) -> Unit,
    cameraPositionState: CameraPositionState,
    onRequestClick: (NearbyServiceRequest) -> Unit,
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
            SheetInfoRow(Icons.Default.Payments, "بودجه", request.budgetLabel)
            SheetInfoRow(Icons.Default.Schedule, "زمان", request.scheduledTime)
            SheetInfoRow(Icons.Default.LocationOn, "محل", request.approximateAddress)
            SheetInfoRow(Icons.Default.AccessTime, "ثبت شده", request.createdAt)

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

            // Escrow Assurance
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFFF0FDF4),
                border = BorderStroke(1.dp, Color(0xFF86EFAC)),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(
                        Icons.Default.Verified,
                        contentDescription = null,
                        tint = Color(0xFF16A34A),
                        modifier = Modifier.size(20.dp),
                    )
                    Column {
                        Text(
                            "مبلغ بودجه در حساب امانی کارجور (Escrow)",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF15803D),
                        )
                        Text(
                            "پس از انجام خدمت و تایید کار، وجه بلافاصله به حساب شما واریز می‌شود.",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF166534),
                        )
                    }
                }
            }

            // CTA
            Button(
                onClick = onDeclare,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            ) {
                Text("اعلام آمادگی و ارسال پیشنهاد", color = Color.White, fontWeight = FontWeight.Bold)
            }

            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                Text("بستن")
            }
        }
    }
}

@Composable
private fun SheetInfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
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

data class ActiveServiceOrder(
    val id: String,
    val title: String,
    val category: String,
    val providerName: String,
    val providerRating: Double,
    val statusText: String,
    val etaMinutes: Int,
    val costToman: Long,
)

data class RequesterHomeUiState(
    val activeJobs: Int = 0,
    val completedJobs: Int = 0,
    val locationName: String = "تهران",
    val activeService: ActiveServiceOrder? = null,
    val topProviders: List<com.karvin.app.domain.model.User> = emptyList(),
)

@HiltViewModel
class RequesterHomeViewModel @Inject constructor(
    private val store: com.karvin.app.data.repository.FakeRepositoryStore,
) : ViewModel() {
    val state: StateFlow<RequesterHomeUiState> = store.jobs.map { jobs ->
        val latest = jobs.firstOrNull()
        val activeService = if (latest != null) {
            ActiveServiceOrder(
                id = latest.id,
                title = latest.title,
                category = latest.category.title,
                providerName = "در انتظار اعزام متخصص",
                providerRating = 5.0,
                statusText = "درخواست شما ثبت شده و در انتظار پذیرش است",
                etaMinutes = 15,
                costToman = latest.amount.toLong(),
            )
        } else null
        RequesterHomeUiState(
            activeJobs = jobs.size,
            completedJobs = 0,
            locationName = latest?.address ?: "تهران، میدان انقلاب",
            activeService = activeService,
            topProviders = emptyList(),
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = RequesterHomeUiState()
    )
}

@Composable
fun RequesterHomeScreen(
    navController: NavHostController,
    viewModel: RequesterHomeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    KarvinHomeScaffold(
        navController = navController,
        providerMode = false,
    ) { padding ->
        LazyColumn(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // ─── Top App Bar ───
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    KarvinLogo()
                    Spacer(Modifier.weight(1f))
                    Box {
                        IconButton(onClick = { navController.navigate(Routes.Notifications) }) {
                            Icon(Icons.Default.Notifications, contentDescription = "اعلان‌ها", tint = MaterialTheme.colorScheme.onSurface)
                        }
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary)
                                .align(Alignment.TopEnd),
                        )
                    }
                    IconButton(onClick = { navController.navigate(Routes.Profile) }) {
                        Icon(Icons.Default.Person, contentDescription = "پروفایل", tint = MaterialTheme.colorScheme.primary)
                    }
                }
            }

            // ─── Greeting & Location Header ───
            item {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("سلام، خوش آمدید 👋", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Surface(
                        onClick = { navController.navigate(Routes.RequesterMap) },
                        shape = RoundedCornerShape(20.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                    ) {
                        Row(
                            Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
                            Text(state.locationName, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
                            Text("· تغییر", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // ─── Quick Search Bar Card ───
            item {
                Card(
                    onClick = { navController.navigate(Routes.RequesterMap) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.7f)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
                        Text(
                            "جستجوی خدمت یا متخصص (برق، لوله‌کشی، نظافت...)",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }

            // ─── Hero Action Banner ───
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                ) {
                    Column(
                        Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        Row(verticalAlignment = Alignment.Top) {
                            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("نیاز فوری به متخصص دارید؟", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                Text(
                                    "ثبت درخواست در ۱ دقیقه، با برآورد شفاف قیمت و اعزام سریع نزدیک‌ترین نیروهای تایید شده.",
                                    color = Color.White.copy(alpha = 0.85f),
                                    style = MaterialTheme.typography.bodySmall,
                                    lineHeight = 22.sp,
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = Color.White.copy(alpha = 0.2f),
                                modifier = Modifier.size(48.dp),
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(28.dp))
                                }
                            }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Button(
                                onClick = { navController.navigate(Routes.CreateJob) },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color.White,
                                    contentColor = MaterialTheme.colorScheme.primary,
                                ),
                                modifier = Modifier.weight(1f).height(44.dp),
                            ) {
                                Text("+ ثبت خدمت جدید", fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = { navController.navigate(Routes.RequesterMap) },
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.7f)),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                                modifier = Modifier.weight(1f).height(44.dp),
                            ) {
                                Text("رادار روی نقشه", fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            // ─── Active Ongoing Order Tracker ───
            state.activeService?.let { activeOrder ->
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f)),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text("سفارش فعال شما", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                Surface(
                                    color = MaterialTheme.colorScheme.secondaryContainer,
                                    shape = RoundedCornerShape(8.dp),
                                ) {
                                    Text(
                                        "🚗 در مسیر اعزام",
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                                    )
                                }
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                    Text(activeOrder.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                    Text(
                                        "متخصص: ${activeOrder.providerName} · امتیاز ${activeOrder.providerRating.toString().toPersianDigits()} ⭐",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                    Text(
                                        "⏱️ تخمین رسیدن: ${activeOrder.etaMinutes.toString().toPersianDigits()} دقیقه",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.secondary,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                }
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(
                                    onClick = { navController.navigate(Routes.Chat) },
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1f).height(40.dp),
                                ) {
                                    Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text("گفت‌وگو در چت")
                                }
                                Button(
                                    onClick = { navController.navigate(Routes.RequesterMap) },
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                                    modifier = Modifier.weight(1f).height(40.dp),
                                ) {
                                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text("مشاهده موقعیت")
                                }
                            }
                        }
                    }
                }
            }

            // ─── Service Categories Grid ───
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("دسته‌بندی خدمات", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    TextButton(onClick = { navController.navigate(Routes.RequesterMap) }) {
                        Text("مشاهده همه", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            item {
                val primaryCategories = listOf(
                    Triple("برق‌کاری", "⚡", Color(0xFFF59E0B)),
                    Triple("لوله‌کشی", "🔧", Color(0xFF0284C7)),
                    Triple("نظافت", "🧹", Color(0xFF10B981)),
                    Triple("تعمیرات", "❄️", Color(0xFF6366F1)),
                    Triple("باربری", "📦", Color(0xFFF97316)),
                    Triple("امداد خودرو", "🚗", Color(0xFFEF4444)),
                    Triple("نقاشی", "🎨", Color(0xFF8B5CF6)),
                    Triple("باغبانی", "🌿", Color(0xFF059669)),
                )

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    primaryCategories.chunked(4).forEach { rowItems ->
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            rowItems.forEach { (catTitle, catIcon, accentColor) ->
                                Card(
                                    onClick = { navController.navigate(Routes.RequesterMap) },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
                                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                                ) {
                                    Column(
                                        modifier = Modifier.padding(vertical = 12.dp, horizontal = 4.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(6.dp),
                                    ) {
                                        Surface(
                                            shape = RoundedCornerShape(12.dp),
                                            color = accentColor.copy(alpha = 0.12f),
                                            modifier = Modifier.size(42.dp),
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Text(catIcon, fontSize = 20.sp)
                                            }
                                        }
                                        Text(
                                            catTitle,
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold,
                                            textAlign = TextAlign.Center,
                                            maxLines = 1,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ─── Top Recommended Specialists ───
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("متخصصان برتر نزدیک شما", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    TextButton(onClick = { navController.navigate(Routes.RequesterMap) }) {
                        Text("روی نقشه", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            if (state.topProviders.isEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)),
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Text("📍", fontSize = 28.sp)
                            Text(
                                "نیروهای مجرب به محض ثبت سفارش به محل اعزام می‌شوند",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            } else {
                items(state.topProviders, key = { it.id }) { provider ->
                    Card(
                        onClick = { navController.navigate(Routes.providerProfile(provider.id)) },
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Avatar(provider, size = 54.dp)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(provider.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                    if (provider.isVerified) {
                                        Spacer(Modifier.width(4.dp))
                                        Icon(Icons.Default.CheckCircle, contentDescription = "تایید هویت", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
                                    }
                                }
                                Text(provider.skills.firstOrNull() ?: "متخصص خدمات", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                    RatingLine(provider.rating, provider.reviewCount)
                                    Text("·", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text("${provider.completedJobs.toString().toPersianDigits()} کار موفق", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Button(
                                    onClick = { navController.navigate(Routes.createJob(provider.id)) },
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                    modifier = Modifier.height(34.dp),
                                ) {
                                    Text("درخواست", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                                }
                                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }
            }

            // ─── Summary Metrics ───
            item { Text("خلاصه وضعیت سفارش‌ها", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Card(
                        Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.7f)),
                    ) {
                        Column(Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(state.activeJobs.toString().toPersianDigits(), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            Text("درخواست فعال", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    Card(
                        Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.7f)),
                    ) {
                        Column(Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(state.completedJobs.toString().toPersianDigits(), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                            Text("خدمت تکمیل شده", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(84.dp)) }
        }
    }
}

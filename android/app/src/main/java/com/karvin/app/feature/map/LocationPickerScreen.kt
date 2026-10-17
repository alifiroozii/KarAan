package com.karvin.app.feature.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.InteractiveStreetMapView
import com.karvin.app.core.designsystem.WebMercator
import com.karvin.app.core.location.LocationResult
import com.karvin.app.core.location.LocationTracker
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.toPersianDigits
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LocationPickerViewModel @Inject constructor(
    private val locationTracker: LocationTracker,
) : ViewModel() {
    private val _isLocating = MutableStateFlow(false)
    val isLocating: StateFlow<Boolean> = _isLocating.asStateFlow()

    fun fetchCurrentLocation(onLocationFound: (GeoPoint) -> Unit) {
        _isLocating.value = true
        locationTracker.refresh { result ->
            _isLocating.value = false
            if (result is LocationResult.Available) {
                onLocationFound(result.point)
            }
        }
    }
}

@Composable
fun LocationPickerScreen(
    navController: NavHostController,
    initialLat: Double = 35.7219,
    initialLng: Double = 51.3347,
    viewModel: LocationPickerViewModel = hiltViewModel(),
    onLocationPicked: ((Double, Double) -> Unit)? = null,
) {
    val isLocating by viewModel.isLocating.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()

    var pickedLat by remember { mutableDoubleStateOf(initialLat) }
    var pickedLng by remember { mutableDoubleStateOf(initialLng) }

    LaunchedEffect(Unit) {
        viewModel.fetchCurrentLocation { point ->
            pickedLat = point.latitude
            pickedLng = point.longitude
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            AppTopBar(
                title = "انتخاب موقعیت روی نقشه",
                onBack = { navController.popBackStack() },
            )
        },
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            // High-Resolution Interactive Street Map with OpenStreetMap / CartoDB Voyager tiles
            InteractiveStreetMapView(
                modifier = Modifier.fillMaxSize(),
                centerPoint = GeoPoint(pickedLat, pickedLng),
                userPoint = GeoPoint(pickedLat, pickedLng),
                isPickerMode = true,
                isLocating = isLocating,
                initialZoom = 15.2f,
                onCameraMove = { point ->
                    pickedLat = point.latitude
                    pickedLng = point.longitude
                },
                onMyLocationClick = {
                    viewModel.fetchCurrentLocation { point ->
                        pickedLat = point.latitude
                        pickedLng = point.longitude
                    }
                },
            )

            // Bottom Confirmation Card
            val neighborhood = remember(pickedLat, pickedLng) {
                WebMercator.getTehranNeighborhood(pickedLat, pickedLng)
            }

            Card(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 10.dp),
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column {
                            Text(
                                text = "محل اجرای خدمت یا آدرس اعزام",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                text = neighborhood,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.primary,
                            )
                        }
                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.primaryContainer,
                            modifier = Modifier.size(36.dp),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp),
                                )
                            }
                        }
                    }

                    Text(
                        text = "نقشه را حرکت دهید تا نشانگر دقیقاً روی کوچه و ساختمان مورد نظر قرار گیرد.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(
                                text = "مختصات دقیق GPS:",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text(
                                text = "${String.format("%.4f", pickedLat).toPersianDigits()} , ${String.format("%.4f", pickedLng).toPersianDigits()}",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary,
                            )
                        }
                    }

                    Button(
                        onClick = {
                            onLocationPicked?.invoke(pickedLat, pickedLng)
                            navController.previousBackStackEntry?.savedStateHandle?.set("picked_lat", pickedLat)
                            navController.previousBackStackEntry?.savedStateHandle?.set("picked_lng", pickedLng)
                            navController.previousBackStackEntry?.savedStateHandle?.set("picked_address", neighborhood)
                            navController.popBackStack()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("تایید و انتخاب این موقعیت", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

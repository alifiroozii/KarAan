package com.karvin.app.core.designsystem

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Radar
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.toPersianDigits
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

enum class RadarMapMode {
    RADAR,
    MAP,
}

enum class MapMarkerType {
    PERFORMER,
    JOB,
}


data class RadarMarkerItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val point: GeoPoint,
    val isUrgent: Boolean = false,
    val isVerified: Boolean = false,
    val badgeLabel: String? = null,
    val initial: String = title.take(1),
    val priceLabel: String? = null,
    val category: String = "عمومی",
    val type: MapMarkerType = MapMarkerType.PERFORMER,
    val rating: Double = 4.8,
)

@Composable
fun SmartRadarMapView(
    modifier: Modifier = Modifier,
    userPoint: GeoPoint,
    markers: List<RadarMarkerItem>,
    maxRadiusKm: Double = 5.0,
    isLocating: Boolean = false,
    selectedMarkerId: String? = null,
    onMarkerClick: (RadarMarkerItem) -> Unit,
    onMyLocationClick: () -> Unit,
    onRadiusChange: ((Double) -> Unit)? = null,
    onSearchArea: ((GeoPoint) -> Unit)? = null,
    mapContent: (@Composable () -> Unit)? = null,
) {
    var mode by remember { mutableStateOf(RadarMapMode.MAP) }
    var panOffsetX by remember { mutableFloatStateOf(0f) }
    var panOffsetY by remember { mutableFloatStateOf(0f) }
    var currentRadiusKm by remember(maxRadiusKm) { mutableStateOf(maxRadiusKm) }

    Box(modifier = modifier.fillMaxSize()) {
        if (mode == RadarMapMode.MAP) {
            // Interactive OpenStreetMap / CartoDB Street Map with Rich Pins and Live Street Tiles
            InteractiveStreetMapView(
                centerPoint = userPoint,
                userPoint = userPoint,
                markers = markers,
                selectedMarkerId = selectedMarkerId,
                isLocating = isLocating,
                onMarkerClick = onMarkerClick,
                onMyLocationClick = onMyLocationClick,
            )
        } else {
            // Interactive Smart Radar Canvas
            RadarCanvasView(
                userPoint = userPoint,
                markers = markers,
                radiusKm = currentRadiusKm,
                panOffsetX = panOffsetX,
                panOffsetY = panOffsetY,
                selectedMarkerId = selectedMarkerId,
                onPan = { dx, dy ->
                    panOffsetX += dx
                    panOffsetY += dy
                },
                onMarkerClick = onMarkerClick,
            )
        }

        // Top Navigation Controls: Mode Toggle & GPS status
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 70.dp, start = 16.dp, end = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Mode Switcher Pill (Radar / Map)
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                shadowElevation = 6.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
            ) {
                Row(
                    modifier = Modifier.padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    val isMap = mode == RadarMapMode.MAP
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = if (isMap) MaterialTheme.colorScheme.primary else Color.Transparent,
                        modifier = Modifier.clip(RoundedCornerShape(16.dp)).clickable { mode = RadarMapMode.MAP },
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Icon(
                                Icons.Default.Map,
                                contentDescription = null,
                                tint = if (isMap) Color.White else MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(16.dp),
                            )
                            Text(
                                "نقشه خیابان",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = if (isMap) Color.White else MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    }

                    val isRadar = mode == RadarMapMode.RADAR
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = if (isRadar) MaterialTheme.colorScheme.primary else Color.Transparent,
                        modifier = Modifier.clip(RoundedCornerShape(16.dp)).clickable { mode = RadarMapMode.RADAR },
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Icon(
                                Icons.Default.Radar,
                                contentDescription = null,
                                tint = if (isRadar) Color.White else MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(16.dp),
                            )
                            Text(
                                "رادار ۳۶۰°",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = if (isRadar) Color.White else MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    }
                }
            }

            // Live GPS Status Pill
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                shadowElevation = 6.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(KarjoorColors.Success),
                    )
                    Text(
                        "${String.format("%.3f", userPoint.latitude).toPersianDigits()} , ${String.format("%.3f", userPoint.longitude).toPersianDigits()}",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                }
            }
        }

        // Floating Action Buttons for Radar Mode (Only displayed in RADAR mode)
        if (mode == RadarMapMode.RADAR) {
            Column(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
            // My Location FAB with GPS pulse
            Surface(
                shape = CircleShape,
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 6.dp,
                border = androidx.compose.foundation.BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)),
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .clickable {
                        panOffsetX = 0f
                        panOffsetY = 0f
                        onMyLocationClick()
                    },
            ) {
                Box(contentAlignment = Alignment.Center) {
                    if (isLocating) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.5.dp,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    } else {
                        Icon(
                            Icons.Default.MyLocation,
                            contentDescription = "موقعیت من",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(22.dp),
                        )
                    }
                }
            }

            // Zoom In Radius
            Surface(
                shape = CircleShape,
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 4.dp,
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .clickable {
                        val next = when {
                            currentRadiusKm <= 1.0 -> 3.0
                            currentRadiusKm <= 3.0 -> 5.0
                            currentRadiusKm <= 5.0 -> 10.0
                            else -> 20.0
                        }
                        currentRadiusKm = next
                        onRadiusChange?.invoke(next)
                    },
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Default.Remove, // Zoom out radar = larger km
                        contentDescription = "افزایش محدوده",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }

            // Zoom Out Radius
            Surface(
                shape = CircleShape,
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 4.dp,
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .clickable {
                        val prev = when {
                            currentRadiusKm >= 20.0 -> 10.0
                            currentRadiusKm >= 10.0 -> 5.0
                            currentRadiusKm >= 5.0 -> 3.0
                            else -> 1.0
                        }
                        currentRadiusKm = prev
                        onRadiusChange?.invoke(prev)
                    },
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Default.Add, // Zoom in radar = smaller km
                        contentDescription = "کاهش محدوده",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
        }
    }
}
}

@Composable
private fun RadarCanvasView(
    userPoint: GeoPoint,
    markers: List<RadarMarkerItem>,
    radiusKm: Double,
    panOffsetX: Float,
    panOffsetY: Float,
    selectedMarkerId: String?,
    onPan: (Float, Float) -> Unit,
    onMarkerClick: (RadarMarkerItem) -> Unit,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "RadarSweep")
    val sweepAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 4000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "SweepAngle",
    )

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "PulseScale",
    )

    val density = LocalDensity.current
    val primaryColor = MaterialTheme.colorScheme.primary
    val secondaryColor = MaterialTheme.colorScheme.secondary
    val surfaceColor = MaterialTheme.colorScheme.surface
    val isDark = MaterialTheme.colorScheme.surface.red < 0.5f

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(if (isDark) Color(0xFF0D1526) else Color(0xFFF1F5F9))
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    onPan(dragAmount.x, dragAmount.y)
                }
            },
    ) {
        val widthPx = constraints.maxWidth.toFloat()
        val heightPx = constraints.maxHeight.toFloat()
        val centerX = (widthPx / 2f) + panOffsetX
        val centerY = (heightPx / 2f) + panOffsetY
        val maxRadarRadius = (minOf(widthPx, heightPx) * 0.42f)

        // 1. Radar background canvas: grid rings, crosshairs, animated sweep
        Canvas(modifier = Modifier.fillMaxSize()) {
            val ringCount = 3
            val ringStep = maxRadarRadius / ringCount

            // Radar background circular fill
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        primaryColor.copy(alpha = 0.08f),
                        primaryColor.copy(alpha = 0.03f),
                        Color.Transparent,
                    ),
                    center = Offset(centerX, centerY),
                    radius = maxRadarRadius * 1.05f,
                ),
                radius = maxRadarRadius * 1.05f,
                center = Offset(centerX, centerY),
            )

            // Concentric rings
            for (i in 1..ringCount) {
                val r = ringStep * i
                drawCircle(
                    color = primaryColor.copy(alpha = if (i == ringCount) 0.35f else 0.18f),
                    radius = r,
                    center = Offset(centerX, centerY),
                    style = Stroke(
                        width = if (i == ringCount) 2f else 1.2f,
                        pathEffect = if (i < ringCount) PathEffect.dashPathEffect(floatArrayOf(12f, 12f), 0f) else null,
                    ),
                )
            }

            // Crosshair lines (North-South, East-West)
            drawLine(
                color = primaryColor.copy(alpha = 0.2f),
                start = Offset(centerX - maxRadarRadius, centerY),
                end = Offset(centerX + maxRadarRadius, centerY),
                strokeWidth = 1f,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f),
            )
            drawLine(
                color = primaryColor.copy(alpha = 0.2f),
                start = Offset(centerX, centerY - maxRadarRadius),
                end = Offset(centerX, centerY + maxRadarRadius),
                strokeWidth = 1f,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f),
            )

            // Animated sweeping radar beam
            drawArc(
                brush = Brush.sweepGradient(
                    0.0f to Color.Transparent,
                    0.85f to Color.Transparent,
                    0.95f to primaryColor.copy(alpha = 0.08f),
                    1.0f to primaryColor.copy(alpha = 0.35f),
                    center = Offset(centerX, centerY),
                ),
                startAngle = sweepAngle - 45f,
                sweepAngle = 45f,
                useCenter = true,
                topLeft = Offset(centerX - maxRadarRadius, centerY - maxRadarRadius),
                size = androidx.compose.ui.geometry.Size(maxRadarRadius * 2f, maxRadarRadius * 2f),
            )

            // User GPS pulsing rings
            drawCircle(
                color = primaryColor.copy(alpha = 0.25f),
                radius = 28f * pulseScale,
                center = Offset(centerX, centerY),
            )
            drawCircle(
                color = Color.White,
                radius = 12f,
                center = Offset(centerX, centerY),
            )
            drawCircle(
                color = primaryColor,
                radius = 8f,
                center = Offset(centerX, centerY),
            )
        }

        // Distance indicators on rings
        val kmSteps = listOf(radiusKm * 0.33, radiusKm * 0.66, radiusKm)
        val ringStep = maxRadarRadius / 3
        kmSteps.forEachIndexed { index, km ->
            val ringR = ringStep * (index + 1)
            val ringY = centerY - ringR
            if (ringY > 0 && ringY < heightPx) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = surfaceColor.copy(alpha = 0.85f),
                    border = androidx.compose.foundation.BorderStroke(0.5.dp, primaryColor.copy(alpha = 0.3f)),
                    modifier = Modifier
                        .offset {
                            IntOffset(
                                x = (centerX - with(density) { 24.dp.toPx() }).roundToInt(),
                                y = (ringY - with(density) { 10.dp.toPx() }).roundToInt(),
                            )
                        },
                ) {
                    Text(
                        text = "${String.format("%.1f", km).toPersianDigits()} کیلومتر",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                    )
                }
            }
        }

        // 2. Interactive Markers on the radar plane
        markers.forEach { marker ->
            val dLatKm = (marker.point.latitude - userPoint.latitude) * 111.0
            val dLngKm = (marker.point.longitude - userPoint.longitude) * 111.0 * cos(Math.toRadians(userPoint.latitude))
            val distKm = sqrt(dLatKm * dLatKm + dLngKm * dLngKm)

            // Project to radar plane coordinates
            val normalizedDist = (distKm / radiusKm).toFloat().coerceIn(0.12f, 1.15f)
            val pixelDist = normalizedDist * maxRadarRadius
            val angleRad = Math.atan2(dLatKm, dLngKm)

            val markerX = centerX + (pixelDist * cos(angleRad)).toFloat()
            val markerY = centerY - (pixelDist * sin(angleRad)).toFloat()

            val isSelected = marker.id == selectedMarkerId

            // Marker composable positioned at (markerX, markerY)
            Box(
                modifier = Modifier
                    .offset {
                        IntOffset(
                            x = (markerX - with(density) { 24.dp.toPx() }).roundToInt(),
                            y = (markerY - with(density) { 24.dp.toPx() }).roundToInt(),
                        )
                    }
                    .clip(CircleShape)
                    .clickable { onMarkerClick(marker) },
            ) {
                Surface(
                    shape = CircleShape,
                    color = if (isSelected) primaryColor else surfaceColor,
                    shadowElevation = if (isSelected) 8.dp else 4.dp,
                    border = androidx.compose.foundation.BorderStroke(
                        width = if (isSelected) 2.dp else 1.5.dp,
                        color = if (marker.isUrgent) KarjoorColors.AccentCoral else if (isSelected) Color.White else primaryColor,
                    ),
                    modifier = Modifier.size(48.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = marker.initial,
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                            )
                            if (marker.badgeLabel != null) {
                                Text(
                                    text = marker.badgeLabel,
                                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 8.sp),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    color = if (isSelected) Color.White.copy(alpha = 0.9f) else primaryColor,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

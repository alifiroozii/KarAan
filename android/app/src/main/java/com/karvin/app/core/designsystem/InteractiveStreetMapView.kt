package com.karvin.app.core.designsystem

import androidx.compose.animation.core.Animatable
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
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.TwoWheeler
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Place
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import coil3.compose.AsyncImage
import coil3.network.NetworkHeaders
import coil3.network.httpHeaders
import coil3.request.ImageRequest
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.toPersianDigits
import com.karvin.app.domain.model.toRatingString
import com.karvin.app.domain.model.toTomanString
import com.karvin.app.domain.model.toShortToman
import kotlinx.coroutines.launch
import kotlin.math.atan
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sinh
import kotlin.math.tan

object WebMercator {
    fun latLngToPixel(lat: Double, lng: Double, zoom: Float): Pair<Double, Double> {
        val n = 2.0.pow(zoom.toDouble()) * 256.0
        val x = (lng + 180.0) / 360.0 * n
        val latRad = Math.toRadians(lat.coerceIn(-85.0511, 85.0511))
        val y = (1.0 - (ln(tan(latRad) + 1.0 / cos(latRad)) / Math.PI)) / 2.0 * n
        return Pair(x, y)
    }

    fun pixelToLatLng(pixelX: Double, pixelY: Double, zoom: Float): Pair<Double, Double> {
        val n = 2.0.pow(zoom.toDouble()) * 256.0
        val lng = pixelX / n * 360.0 - 180.0
        val m = Math.PI - (2.0 * Math.PI * pixelY / n)
        val latRad = atan(sinh(m))
        val lat = Math.toDegrees(latRad)
        return Pair(lat, lng)
    }

    fun getTehranNeighborhood(lat: Double, lng: Double): String {
        return when {
            lat >= 35.77 && lng in 51.34..51.39 -> "تهران، سعادت‌آباد"
            lat >= 35.75 && lng in 51.34..51.38 -> "تهران، شهرک غرب"
            lat >= 35.79 && lng >= 51.39 -> "تهران، ولنجک و تجریش"
            lat in 35.74..35.78 && lng in 51.39..51.42 -> "تهران، میدان ونک و ملاصدرا"
            lat in 35.75..35.79 && lng in 51.42..51.45 -> "تهران، بلوار نلسون ماندلا (جردن)"
            lat in 35.74..35.78 && lng >= 51.45 -> "تهران، پاسداران و دروس"
            lat in 35.70..35.74 && lng in 51.38..51.43 -> "تهران، بلوار کشاورز و میدان ولیعصر"
            lat in 35.71..35.75 && lng in 51.30..51.35 -> "تهران، صادقیه و پونک"
            else -> "تهران، محدوده مرکزی"
        }
    }
}

enum class MapStyleType(val title: String, val badge: String) {
    OSM_DETAILED("معابر و کوچه‌ها (فارسی)", "کوچه‌ها"),
    SNAPP_LIGHT("اسنپ مینیمال", "مینیمال"),
    ARCGIS_STREET("خیابان‌های شریانی", "شریانی"),
    SATELLITE("تصاویر ماهواره‌ای", "ماهواره"),
}

@Composable
fun InteractiveStreetMapView(
    modifier: Modifier = Modifier,
    centerPoint: GeoPoint,
    userPoint: GeoPoint? = null,
    markers: List<RadarMarkerItem> = emptyList(),
    selectedMarkerId: String? = null,
    isPickerMode: Boolean = false,
    isLocating: Boolean = false,
    initialZoom: Float = 15.0f,
    showNeighborhoodPill: Boolean = false,
    showRadarRings: Boolean = true,
    // Live Tracking & Route Parameters
    routePoints: List<GeoPoint> = emptyList(),
    jobTargetPoint: GeoPoint? = null,
    jobAddressLabel: String? = null,
    enRouteWorkerPoint: GeoPoint? = null,
    enRouteWorkerName: String? = null,
    enRouteWorkerEta: String? = null,
    onMarkerClick: ((RadarMarkerItem) -> Unit)? = null,
    onCameraMove: ((GeoPoint) -> Unit)? = null,
    onMyLocationClick: (() -> Unit)? = null,
) {
    var zoomLevel by remember { mutableFloatStateOf(initialZoom) }
    var currentLat by remember(centerPoint.latitude) { mutableDoubleStateOf(centerPoint.latitude) }
    var currentLng by remember(centerPoint.longitude) { mutableDoubleStateOf(centerPoint.longitude) }
    var currentMapStyle by remember { mutableStateOf(MapStyleType.OSM_DETAILED) }

    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current
    val networkHeaders = remember {
        NetworkHeaders.Builder()
            .set("User-Agent", "KarAanApp/1.0 (Android; ir.karan; contact@karan.app)")
            .build()
    }

    // Smooth GPS tracking transition
    LaunchedEffect(centerPoint) {
        currentLat = centerPoint.latitude
        currentLng = centerPoint.longitude
    }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        BoxWithConstraints(modifier = modifier.fillMaxSize()) {
            val widthPx = constraints.maxWidth.toFloat()
            val heightPx = constraints.maxHeight.toFloat()
            val density = LocalDensity.current

            val z = floor(zoomLevel).toInt().coerceIn(11, 19)
            val scaleInTile = 2.0.pow((zoomLevel - z).toDouble()).toFloat()

            // Base pixel position of camera center at integer zoom z
            val (cx, cy) = WebMercator.latLngToPixel(currentLat, currentLng, z.toFloat())

            // Calculate tile range to render
            val viewW = widthPx / scaleInTile
            val viewH = heightPx / scaleInTile
            val minX = cx - viewW / 2.0
            val maxX = cx + viewW / 2.0
            val minY = cy - viewH / 2.0
            val maxY = cy + viewH / 2.0

            val minTileX = floor(minX / 256.0).toInt() - 1
            val maxTileX = floor(maxX / 256.0).toInt() + 1
            val minTileY = floor(minY / 256.0).toInt() - 1
            val maxTileY = floor(maxY / 256.0).toInt() + 1

            val maxTiles = 1 shl z
            val snappPastelFilter = remember {
                ColorFilter.colorMatrix(
                    ColorMatrix().apply {
                        setToSaturation(0.65f)
                    }
                )
            }

            // Gesture handling Box
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectTapGestures(
                            onDoubleTap = { tapOffset ->
                                val (tapLat, tapLng) = WebMercator.pixelToLatLng(
                                    cx + (tapOffset.x - widthPx / 2f) / scaleInTile,
                                    cy + (tapOffset.y - heightPx / 2f) / scaleInTile,
                                    z.toFloat()
                                )
                                currentLat = tapLat
                                currentLng = tapLng
                                zoomLevel = (zoomLevel + 1.0f).coerceAtMost(19.5f)
                                onCameraMove?.invoke(GeoPoint(tapLat, tapLng))
                            }
                        )
                    }
                    .pointerInput(z, scaleInTile) {
                        detectTransformGestures { _, pan, zoomFactor, _ ->
                            // Smooth Zoom up to 19.5 (Detailed Streets & Alleys)
                            if (zoomFactor != 1f) {
                                val newZoom = (zoomLevel * zoomFactor).coerceIn(11.0f, 19.5f)
                                zoomLevel = newZoom
                            }
                            // Smooth Pan
                            if (pan.x != 0f || pan.y != 0f) {
                                val dxPx = -pan.x / scaleInTile
                                val dyPx = -pan.y / scaleInTile
                                val (newLat, newLng) = WebMercator.pixelToLatLng(
                                    cx + dxPx,
                                    cy + dyPx,
                                    z.toFloat()
                                )
                                currentLat = newLat
                                currentLng = newLng
                                onCameraMove?.invoke(GeoPoint(newLat, newLng))
                                com.karvin.app.core.network.MobileDashboardSync.syncLocationMovement(newLat, newLng, "USER")
                            }
                        }
                    }
            ) {
                // Layer 1: Snapp-Style Vector Fallback Underlay (ensures zero blank screens while tiles load)
                Canvas(modifier = Modifier.fillMaxSize()) {
                    // Snapp Land Base
                    drawRect(color = Color(0xFFF3F4F6))

                    // Snapp Park Green Patch Underlays
                    drawCircle(
                        color = Color(0xFFE8F5E9),
                        radius = 280f * scaleInTile,
                        center = Offset(widthPx * 0.25f, heightPx * 0.35f)
                    )
                    drawCircle(
                        color = Color(0xFFE8F5E9),
                        radius = 340f * scaleInTile,
                        center = Offset(widthPx * 0.78f, heightPx * 0.70f)
                    )

                    // Snapp Water / River stream
                    val riverPath = Path().apply {
                        moveTo(0f, heightPx * 0.55f)
                        cubicTo(
                            widthPx * 0.35f, heightPx * 0.52f,
                            widthPx * 0.65f, heightPx * 0.62f,
                            widthPx, heightPx * 0.58f
                        )
                    }
                    drawPath(
                        path = riverPath,
                        color = Color(0xFFE0F2FE),
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = 38f * scaleInTile)
                    )

                    // Snapp Crisp White Road Network with subtle gray borders
                    val gridSpacing = 84f * scaleInTile
                    var gx = (widthPx / 2.0f - (cx % 256.0).toFloat() * scaleInTile) % gridSpacing
                    while (gx < widthPx) {
                        // Road casing
                        drawLine(
                            color = Color(0xFFE5E7EB),
                            start = Offset(gx, 0f),
                            end = Offset(gx, heightPx),
                            strokeWidth = 10f * scaleInTile,
                        )
                        // Road surface (pure white like Snapp)
                        drawLine(
                            color = Color.White,
                            start = Offset(gx, 0f),
                            end = Offset(gx, heightPx),
                            strokeWidth = 7f * scaleInTile,
                        )
                        gx += gridSpacing
                    }
                    var gy = (heightPx / 2.0f - (cy % 256.0).toFloat() * scaleInTile) % gridSpacing
                    while (gy < heightPx) {
                        // Road casing
                        drawLine(
                            color = Color(0xFFE5E7EB),
                            start = Offset(0f, gy),
                            end = Offset(widthPx, gy),
                            strokeWidth = 10f * scaleInTile,
                        )
                        // Road surface (pure white like Snapp)
                        drawLine(
                            color = Color.White,
                            start = Offset(0f, gy),
                            end = Offset(widthPx, gy),
                            strokeWidth = 7f * scaleInTile,
                        )
                        gy += gridSpacing
                    }
                }

                // Layer 2: High-Resolution Street Raster Tiles (OpenStreetMap Detailed Persian / Esri World Street / Satellite)
                for (tx in minTileX..maxTileX) {
                    for (ty in minTileY..maxTileY) {
                        if (tx in 0 until maxTiles && ty in 0 until maxTiles) {
                            val tileLeftPx = ((tx * 256.0 - cx) * scaleInTile + widthPx / 2.0).toFloat()
                            val tileTopPx = ((ty * 256.0 - cy) * scaleInTile + heightPx / 2.0).toFloat()
                            val tileSizePx = (256.0 * scaleInTile).toFloat()

                            val tileUrl = when (currentMapStyle) {
                                MapStyleType.OSM_DETAILED -> {
                                    "https://tile.openstreetmap.org/$z/$tx/$ty.png"
                                }
                                MapStyleType.SNAPP_LIGHT -> {
                                    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/$z/$ty/$tx"
                                }
                                MapStyleType.ARCGIS_STREET -> {
                                    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/$z/$ty/$tx"
                                }
                                MapStyleType.SATELLITE -> {
                                    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/$z/$ty/$tx"
                                }
                            }

                            val tileRequest = remember<ImageRequest>(tileUrl) {
                                ImageRequest.Builder(context)
                                    .data(tileUrl)
                                    .httpHeaders(networkHeaders)
                                    .build()
                            }

                            key(tx, ty, z, currentMapStyle) {
                                AsyncImage(
                                    model = tileRequest,
                                    contentDescription = null,
                                    contentScale = ContentScale.FillBounds,
                                    modifier = Modifier
                                        .offset { IntOffset(tileLeftPx.roundToInt(), tileTopPx.roundToInt()) }
                                        .size(with(density) { tileSizePx.toDp() }),
                                )
                                if (currentMapStyle == MapStyleType.SNAPP_LIGHT) {
                                    val refUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/$z/$ty/$tx"
                                    val refRequest = remember<ImageRequest>(refUrl) {
                                        ImageRequest.Builder(context)
                                            .data(refUrl)
                                            .httpHeaders(networkHeaders)
                                            .build()
                                    }
                                    AsyncImage(
                                        model = refRequest,
                                        contentDescription = null,
                                        contentScale = ContentScale.FillBounds,
                                        modifier = Modifier
                                            .offset { IntOffset(tileLeftPx.roundToInt(), tileTopPx.roundToInt()) }
                                            .size(with(density) { tileSizePx.toDp() }),
                                    )
                                }
                            }
                        }
                    }
                }

                // Layer 2.5: Concentric Radar Distance Rings (Matching Stitch Radar Screen 7cb59bda)
                if (showRadarRings && userPoint != null && !isPickerMode) {
                    val (ux, uy) = WebMercator.latLngToPixel(userPoint.latitude, userPoint.longitude, z.toFloat())
                    val userScreenX = ((ux - cx) * scaleInTile + widthPx / 2.0).toFloat()
                    val userScreenY = ((uy - cy) * scaleInTile + heightPx / 2.0).toFloat()

                    // Mercator meter-to-pixel scale factor at user latitude
                    val metersPerPixel = (156543.03392 * cos(Math.toRadians(userPoint.latitude)) / 2.0.pow(zoomLevel.toDouble())).toFloat()

                    val radiiMeters = listOf(500f, 1000f, 2000f, 4000f)

                    Canvas(modifier = Modifier.fillMaxSize()) {
                        radiiMeters.forEach { meters ->
                            val rPx = meters / metersPerPixel
                            if (rPx in 15f..2500f) {
                                drawCircle(
                                    color = Color(0xFF2563EB).copy(alpha = 0.22f),
                                    radius = rPx,
                                    center = Offset(userScreenX, userScreenY),
                                    style = androidx.compose.ui.graphics.drawscope.Stroke(
                                        width = 1.4.dp.toPx(),
                                        pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(12f, 12f), 0f)
                                    )
                                )
                            }
                        }
                    }
                }

                // Layer 2.8: Route Polyline between Worker and Job Location
                if (routePoints.size >= 2) {
                    val screenPoints = routePoints.map { pt ->
                        val (px, py) = WebMercator.latLngToPixel(pt.latitude, pt.longitude, z.toFloat())
                        Offset(
                            ((px - cx) * scaleInTile + widthPx / 2.0).toFloat(),
                            ((py - cy) * scaleInTile + heightPx / 2.0).toFloat()
                        )
                    }

                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val path = Path().apply {
                            moveTo(screenPoints.first().x, screenPoints.first().y)
                            for (i in 1 until screenPoints.size) {
                                lineTo(screenPoints[i].x, screenPoints[i].y)
                            }
                        }

                        // Outer casing / glow
                        drawPath(
                            path = path,
                            color = Color(0xFF2563EB).copy(alpha = 0.32f),
                            style = Stroke(
                                width = 13.dp.toPx(),
                                cap = StrokeCap.Round,
                                join = StrokeJoin.Round
                            )
                        )

                        // Core solid route line
                        drawPath(
                            path = path,
                            color = Color(0xFF2563EB),
                            style = Stroke(
                                width = 5.5.dp.toPx(),
                                cap = StrokeCap.Round,
                                join = StrokeJoin.Round
                            )
                        )

                        // Inner directional dashed accent
                        drawPath(
                            path = path,
                            color = Color(0xFF93C5FD),
                            style = Stroke(
                                width = 2.dp.toPx(),
                                cap = StrokeCap.Round,
                                pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(14f, 14f), 0f)
                            )
                        )
                    }
                }

                // Layer 3: Interactive Rich Pins for People and Jobs
                if (!isPickerMode) {
                    // Sort so the selected marker is always drawn last (on top)
                    val sortedMarkers = remember(markers, selectedMarkerId) {
                        markers.sortedBy { if (it.id == selectedMarkerId) 100 else 0 }
                    }

                    sortedMarkers.forEach { marker ->
                        val (mx, my) = WebMercator.latLngToPixel(marker.point.latitude, marker.point.longitude, z.toFloat())
                        val screenX = ((mx - cx) * scaleInTile + widthPx / 2.0).toFloat()
                        val screenY = ((my - cy) * scaleInTile + heightPx / 2.0).toFloat()

                        // Only render if in visible bounds + margin
                        if (screenX in -200f..(widthPx + 200f) && screenY in -200f..(heightPx + 200f)) {
                            val isSelected = marker.id == selectedMarkerId

                            Box(
                                modifier = Modifier
                                    .layout { measurable, constraints ->
                                        val placeable = measurable.measure(constraints)
                                        layout(0, 0) {
                                            placeable.place(
                                                (screenX - placeable.width / 2f).roundToInt(),
                                                (screenY - placeable.height).roundToInt()
                                            )
                                        }
                                    }
                                    .scale(if (isSelected) 1.10f else 1.0f)
                                    .clickable { onMarkerClick?.invoke(marker) }
                            ) {
                                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                                    RichMapMarkerPin(
                                        marker = marker,
                                        isSelected = isSelected,
                                        zoomLevel = zoomLevel,
                                    )
                                }
                            }
                        }
                    }

                    // User GPS Location Pin with Radar Pulse
                    userPoint?.let { up ->
                        val (ux, uy) = WebMercator.latLngToPixel(up.latitude, up.longitude, z.toFloat())
                        val userScreenX = ((ux - cx) * scaleInTile + widthPx / 2.0).toFloat()
                        val userScreenY = ((uy - cy) * scaleInTile + heightPx / 2.0).toFloat()

                        Box(
                            modifier = Modifier
                                .layout { measurable, constraints ->
                                    val placeable = measurable.measure(constraints)
                                    layout(0, 0) {
                                        placeable.place(
                                            (userScreenX - placeable.width / 2f).roundToInt(),
                                            (userScreenY - placeable.height / 2f).roundToInt()
                                        )
                                    }
                                }
                                .size(60.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            UserGpsPulseBeacon()
                        }
                    }

                    // Layer 3.2: Job Location Target Pin (محل کار درخواست‌دهنده)
                    jobTargetPoint?.let { jp ->
                        val (jx, jy) = WebMercator.latLngToPixel(jp.latitude, jp.longitude, z.toFloat())
                        val jobScreenX = ((jx - cx) * scaleInTile + widthPx / 2.0).toFloat()
                        val jobScreenY = ((jy - cy) * scaleInTile + heightPx / 2.0).toFloat()

                        if (jobScreenX in -250f..(widthPx + 250f) && jobScreenY in -250f..(heightPx + 250f)) {
                            Box(
                                modifier = Modifier
                                    .layout { measurable, constraints ->
                                        val placeable = measurable.measure(constraints)
                                        layout(0, 0) {
                                            placeable.place(
                                                (jobScreenX - placeable.width / 2f).roundToInt(),
                                                (jobScreenY - placeable.height).roundToInt()
                                            )
                                        }
                                    }
                            ) {
                                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                                    JobLocationTargetPin(
                                        address = jobAddressLabel ?: WebMercator.getTehranNeighborhood(jp.latitude, jp.longitude)
                                    )
                                }
                            }
                        }
                    }

                    // Layer 3.3: Worker En-Route Live Pin (موقعیت و حرکت متخصص)
                    enRouteWorkerPoint?.let { wp ->
                        val (wx, wy) = WebMercator.latLngToPixel(wp.latitude, wp.longitude, z.toFloat())
                        val workerScreenX = ((wx - cx) * scaleInTile + widthPx / 2.0).toFloat()
                        val workerScreenY = ((wy - cy) * scaleInTile + heightPx / 2.0).toFloat()

                        if (workerScreenX in -250f..(widthPx + 250f) && workerScreenY in -250f..(heightPx + 250f)) {
                            Box(
                                modifier = Modifier
                                    .layout { measurable, constraints ->
                                        val placeable = measurable.measure(constraints)
                                        layout(0, 0) {
                                            placeable.place(
                                                (workerScreenX - placeable.width / 2f).roundToInt(),
                                                (workerScreenY - placeable.height).roundToInt()
                                            )
                                        }
                                    }
                            ) {
                                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                                    WorkerEnRoutePin(
                                        name = enRouteWorkerName ?: "متخصص در مسیر",
                                        eta = enRouteWorkerEta ?: "در راه",
                                    )
                                }
                            }
                        }
                    }
                }

                // Picker Mode Fixed Center Pin
                if (isPickerMode) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(bottom = 38.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            // Pin Head (Snapp Iconic Emerald Pin)
                            Surface(
                                shape = CircleShape,
                                color = Color(0xFF05CD85),
                                shadowElevation = 10.dp,
                                border = androidx.compose.foundation.BorderStroke(2.5.dp, Color.White),
                                modifier = Modifier.size(46.dp),
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.LocationOn,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(28.dp),
                                    )
                                }
                            }
                            // Pin Stem
                            Box(
                                modifier = Modifier
                                    .width(3.dp)
                                    .height(10.dp)
                                    .background(Color(0xFF05CD85)),
                            )
                            // Pin Ground Shadow Reticle & Pulse Halo (Snapp Style)
                            Box(
                                modifier = Modifier
                                    .size(16.dp, 8.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF05CD85).copy(alpha = 0.45f)),
                            )
                        }
                    }
                }
            }

        // Floating HUD Map Controls (Google Stitch Apple Maps Unified Dock)
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
            Box(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier
                        .align(Alignment.CenterStart)
                        .padding(start = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    // 1. My Location FAB (Apple Maps / Stitch style)
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color.White.copy(alpha = 0.96f),
                        shadowElevation = 5.dp,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .clickable {
                                userPoint?.let {
                                    currentLat = it.latitude
                                    currentLng = it.longitude
                                    zoomLevel = 15.2f
                                    onCameraMove?.invoke(it)
                                }
                                onMyLocationClick?.invoke()
                            },
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            if (isLocating) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    strokeWidth = 2.dp,
                                    color = Color(0xFF2563EB),
                                )
                            } else {
                                Icon(
                                    Icons.Default.MyLocation,
                                    contentDescription = "موقعیت من",
                                    tint = Color(0xFF2563EB),
                                    modifier = Modifier.size(20.dp),
                                )
                            }
                        }
                    }

                    // 2. Unified Zoom Capsule (+ and - together)
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color.White.copy(alpha = 0.96f),
                        shadowElevation = 5.dp,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        modifier = Modifier.width(38.dp),
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clickable {
                                        zoomLevel = (zoomLevel + 0.8f).coerceAtMost(18.0f)
                                    },
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    Icons.Default.Add,
                                    contentDescription = "بزرگ‌نمایی",
                                    tint = Color(0xFF0F172A),
                                    modifier = Modifier.size(18.dp),
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(1.dp)
                                    .background(Color(0xFFE2E8F0))
                            )
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clickable {
                                        zoomLevel = (zoomLevel - 0.8f).coerceAtLeast(11.5f)
                                    },
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    Icons.Default.Remove,
                                    contentDescription = "کوچک‌نمایی",
                                    tint = Color(0xFF0F172A),
                                    modifier = Modifier.size(18.dp),
                                )
                            }
                        }
                    }

                    // 3. Map Style Layers Switcher
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color.White.copy(alpha = 0.96f),
                        shadowElevation = 5.dp,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .clickable {
                                currentMapStyle = when (currentMapStyle) {
                                    MapStyleType.OSM_DETAILED -> MapStyleType.SNAPP_LIGHT
                                    MapStyleType.SNAPP_LIGHT -> MapStyleType.ARCGIS_STREET
                                    MapStyleType.ARCGIS_STREET -> MapStyleType.SATELLITE
                                    MapStyleType.SATELLITE -> MapStyleType.OSM_DETAILED
                                }
                            },
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                Icons.Default.Layers,
                                contentDescription = "تغییر لایه نقشه: ${currentMapStyle.title}",
                                tint = when (currentMapStyle) {
                                    MapStyleType.OSM_DETAILED -> Color(0xFF059669)
                                    MapStyleType.SNAPP_LIGHT -> Color(0xFF2563EB)
                                    MapStyleType.ARCGIS_STREET -> Color(0xFF6366F1)
                                    MapStyleType.SATELLITE -> Color(0xFFF59E0B)
                                },
                                modifier = Modifier.size(19.dp),
                            )
                        }
                    }
                }
            }
        }

        // Floating Neighborhood & Zoom Status Pill (optional, for picker or standalone mode)
        if (showNeighborhoodPill) {
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = if (isPickerMode) 16.dp else 12.dp),
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                    shadowElevation = 5.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(KarjoorColors.Secondary),
                        )
                        Text(
                            text = WebMercator.getTehranNeighborhood(currentLat, currentLng),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            text = "•",
                            color = MaterialTheme.colorScheme.outline,
                            fontSize = 11.sp,
                        )
                        Text(
                            text = "مقیاس: ${z.toString().toPersianDigits()}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}
}

/**
 * Rich Google-Stitch Style Map Pin for Specialists (Performers) and Jobs.
 * Adapts dynamically to zoom level:
 * - Low zoom (< 14.2): Sleek circular pin drop with micro price badge (no overlap, ~40dp wide)
 * - Mid zoom (14.2 - 15.2): Compact Stitch pill with category icon, title, and price
 * - High zoom (>= 15.2) or Selected: Full Stitch card with avatar, verified badge, rating, subtitle, and price
 */
@Composable
private fun RichMapMarkerPin(
    marker: RadarMarkerItem,
    isSelected: Boolean,
    zoomLevel: Float,
) {
    val isJob = marker.type == MapMarkerType.JOB || marker.subtitle.contains("کارگر") || marker.subtitle.contains("خدمات")
    val primaryColor = if (isJob) MaterialTheme.colorScheme.primary else KarjoorColors.Secondary
    val priceText = marker.priceLabel ?: marker.badgeLabel ?: "توافقی"

    val categoryIcon = when {
        marker.title.contains("برق") || marker.subtitle.contains("برق") -> "⚡"
        marker.title.contains("کولر") || marker.title.contains("پکیج") -> "❄️"
        marker.title.contains("لوله") -> "🔧"
        marker.title.contains("سینک") -> "🚿"
        marker.title.contains("نظافت") -> "🧹"
        marker.title.contains("نقاش") -> "🎨"
        marker.title.contains("انبار") || marker.title.contains("اسباب") -> "📦"
        marker.title.contains("درخت") -> "🌳"
        marker.title.contains("دوربین") -> "📹"
        marker.title.contains("آیفون") || marker.title.contains("موبایل") -> "📱"
        isJob -> "💼"
        else -> marker.initial
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (!isSelected && zoomLevel < 15.3f) {
            // Tier 1: Sleek Compact Pin Drop (< 15.3 zoom) - Zero clutter, maximum clarity for city overview
            Surface(
                shape = CircleShape,
                color = when {
                    marker.isUrgent -> Color(0xFFF59E0B)
                    isJob -> MaterialTheme.colorScheme.primary
                    else -> KarjoorColors.Secondary
                },
                shadowElevation = 6.dp,
                border = androidx.compose.foundation.BorderStroke(2.dp, Color.White),
                modifier = Modifier.size(34.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = if (marker.isUrgent) "⚡" else categoryIcon,
                        fontSize = 15.sp,
                        color = Color.White,
                    )
                }
            }

            // Micro Price Tag Pill attached below circle
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                shadowElevation = 3.dp,
                border = androidx.compose.foundation.BorderStroke(0.8.dp, primaryColor.copy(alpha = 0.45f)),
                modifier = Modifier.padding(top = 1.5.dp),
            ) {
                Text(
                    text = priceText.replace(" تومان", " ت"),
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.5.dp),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 9.5.sp,
                    color = primaryColor,
                )
            }
        } else if (!isSelected && zoomLevel < 16.5f) {
            // Tier 2: Compact Stitch Pill (15.3 - 16.5 zoom) - Street level with readable title & price
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 4.dp,
                border = androidx.compose.foundation.BorderStroke(
                    width = 1.dp,
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.8f),
                ),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(CircleShape)
                            .background(
                                if (isJob) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                                else Color(0xFFD1FAE5)
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = categoryIcon,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isJob) MaterialTheme.colorScheme.primary else Color(0xFF047857),
                        )
                    }
                    Text(
                        text = marker.title.take(12),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                    )
                    Text(
                        text = "•",
                        color = MaterialTheme.colorScheme.outlineVariant,
                        fontSize = 8.sp,
                    )
                    Text(
                        text = priceText.replace(" تومان", " ت"),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 10.5.sp,
                        color = primaryColor,
                    )
                    if (!isJob && marker.rating > 0.0) {
                        Text(
                            text = "★${marker.rating.toRatingString()}",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp,
                            color = Color(0xFFB45309),
                        )
                    }
                }
            }
        } else {
            // Tier 3: Full High-Fidelity Google Stitch Marker Card (zoom >= 15.2 or Selected)
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = if (isSelected) 14.dp else 6.dp,
                border = androidx.compose.foundation.BorderStroke(
                    width = if (isSelected) 2.5.dp else 1.2.dp,
                    color = if (isSelected) primaryColor else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.85f),
                ),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(9.dp),
                ) {
                    // Avatar / Category Icon
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                if (isJob) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f)
                                else KarjoorColors.Secondary.copy(alpha = 0.15f)
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = categoryIcon,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isJob) MaterialTheme.colorScheme.primary else KarjoorColors.Secondary,
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp),
                        ) {
                            Text(
                                text = marker.title,
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                            if (marker.isUrgent) {
                                Surface(
                                    shape = RoundedCornerShape(5.dp),
                                    color = KarjoorColors.AccentCoral,
                                ) {
                                    Text(
                                        "فوری",
                                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp),
                                        color = Color.White,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                    )
                                }
                            }
                            if (marker.isVerified) {
                                Surface(
                                    shape = RoundedCornerShape(5.dp),
                                    color = Color(0xFFECFDF5),
                                    border = androidx.compose.foundation.BorderStroke(0.6.dp, Color(0xFFA7F3D0)),
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(2.dp),
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = "تایید شده",
                                            tint = Color(0xFF047857),
                                            modifier = Modifier.size(11.dp),
                                        )
                                        Text(
                                            "تایید شده",
                                            color = Color(0xFF047857),
                                            fontSize = 8.5.sp,
                                            fontWeight = FontWeight.Bold,
                                        )
                                    }
                                }
                            }
                        }

                        // Subtitle / Specialty
                        if (marker.subtitle.isNotBlank() && marker.subtitle != marker.title) {
                            Text(
                                text = marker.subtitle,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 10.5.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }

                        // Price and Rating Row
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = if (isJob) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f) else Color(0xFFD1FAE5),
                            ) {
                                Text(
                                    text = priceText,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (isJob) MaterialTheme.colorScheme.primary else Color(0xFF065F46),
                                )
                            }

                            if (!isJob && marker.rating > 0.0) {
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFFFEF3C7),
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(2.dp),
                                    ) {
                                        Text(
                                            text = marker.rating.toRatingString(),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFFB45309),
                                        )
                                        Icon(
                                            Icons.Default.Star,
                                            contentDescription = null,
                                            tint = Color(0xFFF59E0B),
                                            modifier = Modifier.size(11.dp),
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Pointer Arrow Triangle pointing down to the street
        Canvas(modifier = Modifier.size(14.dp, 8.dp)) {
            val path = Path().apply {
                moveTo(0f, 0f)
                lineTo(size.width, 0f)
                lineTo(size.width / 2f, size.height)
                close()
            }
            drawPath(path, color = if (isSelected) primaryColor else Color.White)
        }
        // Ground contact dot
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(if (isSelected) primaryColor else Color.DarkGray),
        )
    }
}

/**
 * Animated User GPS Beacon with expanding ripples.
 */
@Composable
private fun UserGpsPulseBeacon() {
    val infiniteTransition = rememberInfiniteTransition(label = "gps_pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 2.4f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "pulse_scale",
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 0.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "pulse_alpha",
    )

    Box(contentAlignment = Alignment.Center) {
        // Expanding pulse wave
        Box(
            modifier = Modifier
                .size(24.dp)
                .scale(pulseScale)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary.copy(alpha = pulseAlpha)),
        )
        // Middle Halo
        Box(
            modifier = Modifier
                .size(22.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.35f)),
        )
        // Center GPS Dot
        Box(
            modifier = Modifier
                .size(14.dp)
                .clip(CircleShape)
                .background(Color.White)
                .padding(2.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary),
        )
    }
}

/**
 * Job Location Pin marking requester's project location with target callout.
 */
@Composable
fun JobLocationTargetPin(address: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(bottom = 4.dp),
    ) {
        // Speech Bubble Callout
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = Color(0xFF0F172A),
            shadowElevation = 8.dp,
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFEF4444)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Default.Place,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(12.dp),
                    )
                }
                Column {
                    Text(
                        text = "محل اجرای کار",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFFCA5A5),
                        fontSize = 10.sp,
                    )
                    Text(
                        text = address,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }

        // Small triangle arrow below bubble
        Box(
            modifier = Modifier
                .size(10.dp, 6.dp)
                .background(Color(0xFF0F172A), shape = RoundedCornerShape(bottomStart = 2.dp, bottomEnd = 2.dp))
        )

        // Target Pin Head
        Surface(
            shape = CircleShape,
            color = Color(0xFFDC2626),
            shadowElevation = 10.dp,
            border = androidx.compose.foundation.BorderStroke(3.dp, Color.White),
            modifier = Modifier.size(38.dp),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Default.Home,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(20.dp),
                )
            }
        }
        // Pulse ring under pin
        Box(
            modifier = Modifier
                .size(16.dp, 6.dp)
                .clip(CircleShape)
                .background(Color(0xFFDC2626).copy(alpha = 0.4f)),
        )
    }
}

/**
 * Worker En-Route Marker with motorcycle badge and live ETA callout.
 */
@Composable
fun WorkerEnRoutePin(name: String, eta: String) {
    val infiniteTransition = rememberInfiniteTransition(label = "worker_pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.9f,
        targetValue = 1.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "worker_pulse_scale"
    )

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(bottom = 4.dp),
    ) {
        // ETA pill above worker
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = Color(0xFF059669),
            shadowElevation = 8.dp,
            border = androidx.compose.foundation.BorderStroke(1.5.dp, Color.White),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                )
                Text(
                    text = eta,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontSize = 11.sp,
                )
                Text(
                    text = "• $name",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFFD1FAE5),
                    fontSize = 11.sp,
                )
            }
        }

        Spacer(Modifier.height(4.dp))

        // Worker Pin with Motorcycle & Halo
        Box(contentAlignment = Alignment.Center) {
            // Pulsing Halo
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .scale(pulseScale)
                    .clip(CircleShape)
                    .background(Color(0xFF10B981).copy(alpha = 0.35f))
            )

            // Pin Head
            Surface(
                shape = CircleShape,
                color = Color(0xFF047857),
                shadowElevation = 8.dp,
                border = androidx.compose.foundation.BorderStroke(2.5.dp, Color.White),
                modifier = Modifier.size(40.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.TwoWheeler,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(24.dp),
                    )
                }
            }
        }

        Box(
            modifier = Modifier
                .size(16.dp, 6.dp)
                .clip(CircleShape)
                .background(Color(0xFF047857).copy(alpha = 0.4f)),
        )
    }
}

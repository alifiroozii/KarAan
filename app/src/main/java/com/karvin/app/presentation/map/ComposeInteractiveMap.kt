package com.karvin.app.presentation.map

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Blue500
import com.karvin.app.presentation.theme.Emerald500
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.Red500
import com.karvin.app.utils.PersianDateFormatter
import com.karvin.app.utils.PriceFormatter
import kotlin.math.sqrt

@Composable
fun ComposeInteractiveMap(
    userLocation: LocationPoint,
    jobs: List<Job> = emptyList(),
    workers: List<WorkerProfile> = emptyList(),
    selectedJob: Job? = null,
    selectedWorker: WorkerProfile? = null,
    onJobSelected: (Job) -> Unit = {},
    onWorkerSelected: (WorkerProfile) -> Unit = {},
    modifier: Modifier = Modifier
) {
    var scale by remember { mutableFloatStateOf(1.0f) }
    var offsetX by remember { mutableFloatStateOf(0f) }
    var offsetY by remember { mutableFloatStateOf(0f) }

    // Pulsing radar animation
    val infiniteTransition = rememberInfiniteTransition(label = "RadarPulse")
    val pulseRadiusScale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "PulseRadius"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "PulseAlpha"
    )

    Box(modifier = modifier.fillMaxSize()) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectTransformGestures { _, pan, zoom, _ ->
                        scale = (scale * zoom).coerceIn(0.5f, 3.5f)
                        offsetX += pan.x
                        offsetY += pan.y
                    }
                }
                .pointerInput(jobs, workers, scale, offsetX, offsetY) {
                    detectTapGestures { tapOffset ->
                        val centerX = size.width / 2f + offsetX
                        val centerY = size.height / 2f + offsetY

                        // Check tapped jobs
                        jobs.forEach { job ->
                            val latDiff = (job.latitude ?: userLocation.latitude) - userLocation.latitude
                            val lonDiff = (job.longitude ?: userLocation.longitude) - userLocation.longitude
                            val pinX = centerX + (lonDiff * 8500f * scale).toFloat()
                            val pinY = centerY - (latDiff * 8500f * scale).toFloat()

                            val dist = sqrt((tapOffset.x - pinX) * (tapOffset.x - pinX) + (tapOffset.y - pinY) * (tapOffset.y - pinY))
                            if (dist < 55f) {
                                onJobSelected(job)
                                return@detectTapGestures
                            }
                        }

                        // Check tapped workers
                        workers.forEach { worker ->
                            val latDiff = (worker.latitude ?: userLocation.latitude) - userLocation.latitude
                            val lonDiff = (worker.longitude ?: userLocation.longitude) - userLocation.longitude
                            val pinX = centerX + (lonDiff * 8500f * scale).toFloat()
                            val pinY = centerY - (latDiff * 8500f * scale).toFloat()

                            val dist = sqrt((tapOffset.x - pinX) * (tapOffset.x - pinX) + (tapOffset.y - pinY) * (tapOffset.y - pinY))
                            if (dist < 55f) {
                                onWorkerSelected(worker)
                                return@detectTapGestures
                            }
                        }
                    }
                }
        ) {
            val centerX = size.width / 2f + offsetX
            val centerY = size.height / 2f + offsetY

            // 1. Premium Vector Base Map Background
            drawRect(color = Color(0xFFF1F5F9))

            // 2. City Urban Parcels / Blocks (Simulated Real Estate Zones)
            drawUrbanBlocks(centerX, centerY, scale)

            // 3. Parks & Green Areas (پارک‌ها و بوستان‌های تهران)
            drawParksAndGreens(centerX, centerY, scale)

            // 4. City Road Network (بزرگراه‌ها، بلوارها و خیابان‌های اصلی)
            drawRoadNetwork(centerX, centerY, scale, size)

            // 5. Neighborhood Text Labels (نام محلات تهران)
            drawNeighborhoodLabels(centerX, centerY, scale)

            // 6. Active GPS Radar Pulse Ripple around User Location
            val baseRadius = 140f * scale
            drawCircle(
                color = Emerald600.copy(alpha = pulseAlpha * 0.4f),
                radius = baseRadius * pulseRadiusScale,
                center = Offset(centerX, centerY)
            )
            drawCircle(
                color = Emerald600.copy(alpha = 0.08f),
                radius = baseRadius,
                center = Offset(centerX, centerY)
            )
            drawCircle(
                color = Emerald600.copy(alpha = 0.35f),
                radius = baseRadius,
                center = Offset(centerX, centerY),
                style = Stroke(
                    width = 2f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 10f), 0f)
                )
            )

            // 7. User GPS Location Marker (High-tech Glowing Blue Beacon)
            drawUserBeacon(centerX, centerY, scale)

            // 8. Draw Modern Job Markers (🟠 Orange with Salary / Category Badges)
            jobs.forEach { job ->
                val latDiff = (job.latitude ?: userLocation.latitude) - userLocation.latitude
                val lonDiff = (job.longitude ?: userLocation.longitude) - userLocation.longitude
                val pinX = centerX + (lonDiff * 8500f * scale).toFloat()
                val pinY = centerY - (latDiff * 8500f * scale).toFloat()

                val isSelected = selectedJob?.id == job.id
                drawJobPin(pinX, pinY, job, isSelected, scale)
            }

            // 9. Draw Modern Worker Markers (🟢 Green with Avatar & Availability Dot)
            workers.forEach { worker ->
                val latDiff = (worker.latitude ?: userLocation.latitude) - userLocation.latitude
                val lonDiff = (worker.longitude ?: userLocation.longitude) - userLocation.longitude
                val pinX = centerX + (lonDiff * 8500f * scale).toFloat()
                val pinY = centerY - (latDiff * 8500f * scale).toFloat()

                val isSelected = selectedWorker?.userId == worker.userId
                drawWorkerPin(pinX, pinY, worker, isSelected, scale)
            }
        }

        // Floating Map Controls (Glassmorphic Zoom + Compass + Recenter)
        Column(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Compass / Reset North
            FloatingActionButton(
                onClick = {
                    offsetX = 0f
                    offsetY = 0f
                },
                modifier = Modifier
                    .size(42.dp)
                    .shadow(4.dp, CircleShape),
                shape = CircleShape,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = Navy900,
                elevation = FloatingActionButtonDefaults.elevation(2.dp)
            ) {
                Icon(Icons.Default.Explore, contentDescription = "Reset North", modifier = Modifier.size(20.dp), tint = Navy900)
            }

            // Zoom In
            FloatingActionButton(
                onClick = { scale = (scale * 1.25f).coerceAtMost(3.5f) },
                modifier = Modifier
                    .size(42.dp)
                    .shadow(4.dp, CircleShape),
                shape = CircleShape,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = Navy900,
                elevation = FloatingActionButtonDefaults.elevation(2.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Zoom In", modifier = Modifier.size(20.dp))
            }

            // Zoom Out
            FloatingActionButton(
                onClick = { scale = (scale / 1.25f).coerceAtLeast(0.5f) },
                modifier = Modifier
                    .size(42.dp)
                    .shadow(4.dp, CircleShape),
                shape = CircleShape,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = Navy900,
                elevation = FloatingActionButtonDefaults.elevation(2.dp)
            ) {
                Icon(Icons.Default.Remove, contentDescription = "Zoom Out", modifier = Modifier.size(20.dp))
            }

            // Recenter GPS Button
            FloatingActionButton(
                onClick = {
                    scale = 1.0f
                    offsetX = 0f
                    offsetY = 0f
                },
                modifier = Modifier
                    .size(42.dp)
                    .shadow(4.dp, CircleShape),
                shape = CircleShape,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = Blue500,
                elevation = FloatingActionButtonDefaults.elevation(2.dp)
            ) {
                Icon(Icons.Default.MyLocation, contentDescription = "My Location", modifier = Modifier.size(20.dp), tint = Blue500)
            }
        }

        // Bottom Scale Indicator
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 16.dp, bottom = 20.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(Color.White.copy(alpha = 0.85f))
                .padding(horizontal = 8.dp, vertical = 3.dp)
        ) {
            Text(
                text = "کاروین • محدوده ۲۵ کیلومتر",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Navy900
            )
        }
    }
}

// -------------------------------------------------------------
// Draw Helper Functions
// -------------------------------------------------------------

private fun DrawScope.drawUrbanBlocks(centerX: Float, centerY: Float, scale: Float) {
    val blockColor = Color(0xFFE2E8F0)
    val blockOffsets = listOf(
        Offset(-220f, -240f) to Size(160f, 120f),
        Offset(60f, -260f) to Size(180f, 140f),
        Offset(-260f, 40f) to Size(140f, 150f),
        Offset(70f, 60f) to Size(200f, 160f),
        Offset(-180f, 220f) to Size(150f, 110f),
        Offset(80f, 250f) to Size(170f, 120f),
        Offset(-380f, -120f) to Size(120f, 180f),
        Offset(290f, -160f) to Size(130f, 200f)
    )

    blockOffsets.forEach { (pos, dim) ->
        val x = centerX + pos.x * scale
        val y = centerY + pos.y * scale
        val w = dim.width * scale
        val h = dim.height * scale

        drawRoundRect(
            color = blockColor,
            topLeft = Offset(x, y),
            size = Size(w, h),
            cornerRadius = CornerRadius(12f * scale, 12f * scale)
        )
    }
}

private fun DrawScope.drawParksAndGreens(centerX: Float, centerY: Float, scale: Float) {
    val parkColor = Color(0xFFDCFCE7)
    val parkBorderColor = Color(0xFF86EFAC)

    val parks = listOf(
        // بوستان ملت / پردیسان
        Offset(-120f, -160f) to Size(110f, 80f),
        // بوستان آب و آتش
        Offset(160f, -90f) to Size(90f, 70f),
        // بوستان گفتگو
        Offset(-140f, 90f) to Size(90f, 75f)
    )

    parks.forEach { (pos, dim) ->
        val x = centerX + pos.x * scale
        val y = centerY + pos.y * scale
        val w = dim.width * scale
        val h = dim.height * scale

        drawRoundRect(
            color = parkColor,
            topLeft = Offset(x, y),
            size = Size(w, h),
            cornerRadius = CornerRadius(16f * scale, 16f * scale)
        )
        drawRoundRect(
            color = parkBorderColor,
            topLeft = Offset(x, y),
            size = Size(w, h),
            cornerRadius = CornerRadius(16f * scale, 16f * scale),
            style = Stroke(width = 1.5f * scale)
        )
    }
}

private fun DrawScope.drawRoadNetwork(centerX: Float, centerY: Float, scale: Float, canvasSize: Size) {
    val highwayBg = Color(0xFFCBD5E1)
    val highwayCore = Color(0xFFFEF3C7)
    val boulevardColor = Color.White
    val boulevardBorder = Color(0xFFCBD5E1)

    // 1. Grid of Local Boulevards
    val boulevardSpacing = 160f * scale
    val startX = (centerX % boulevardSpacing) - boulevardSpacing
    val startY = (centerY % boulevardSpacing) - boulevardSpacing

    var cx = startX
    while (cx < canvasSize.width + boulevardSpacing) {
        drawLine(
            color = boulevardBorder,
            start = Offset(cx, 0f),
            end = Offset(cx, canvasSize.height),
            strokeWidth = 7f * scale
        )
        drawLine(
            color = boulevardColor,
            start = Offset(cx, 0f),
            end = Offset(cx, canvasSize.height),
            strokeWidth = 5f * scale
        )
        cx += boulevardSpacing
    }

    var cy = startY
    while (cy < canvasSize.height + boulevardSpacing) {
        drawLine(
            color = boulevardBorder,
            start = Offset(0f, cy),
            end = Offset(canvasSize.width, cy),
            strokeWidth = 7f * scale
        )
        drawLine(
            color = boulevardColor,
            start = Offset(0f, cy),
            end = Offset(canvasSize.width, cy),
            strokeWidth = 5f * scale
        )
        cy += boulevardSpacing
    }

    // 2. Expressway Curves (بزرگراه همت / حکیم / چمران)
    val hemmatPath = Path().apply {
        moveTo(0f, centerY - 50f * scale)
        cubicTo(
            centerX - 100f * scale, centerY - 70f * scale,
            centerX + 100f * scale, centerY - 30f * scale,
            canvasSize.width, centerY - 60f * scale
        )
    }
    // Outer highway border
    drawPath(path = hemmatPath, color = highwayBg, style = Stroke(width = 12f * scale))
    // Inner golden highway surface
    drawPath(path = hemmatPath, color = highwayCore, style = Stroke(width = 8f * scale))

    val chamranPath = Path().apply {
        moveTo(centerX - 40f * scale, 0f)
        cubicTo(
            centerX - 60f * scale, centerY - 100f * scale,
            centerX + 20f * scale, centerY + 120f * scale,
            centerX + 40f * scale, canvasSize.height
        )
    }
    drawPath(path = chamranPath, color = highwayBg, style = Stroke(width = 12f * scale))
    drawPath(path = chamranPath, color = highwayCore, style = Stroke(width = 8f * scale))
}

private fun DrawScope.drawNeighborhoodLabels(centerX: Float, centerY: Float, scale: Float) {
    val paint = android.graphics.Paint().apply {
        isAntiAlias = true
        textSize = (13f * scale).coerceIn(10f, 20f)
        color = android.graphics.Color.parseColor("#475569")
        typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
        textAlign = android.graphics.Paint.Align.CENTER
    }

    val labels = listOf(
        "سعادت‌آباد" to Offset(centerX - 90f * scale, centerY - 190f * scale),
        "شهرک غرب" to Offset(centerX - 150f * scale, centerY - 100f * scale),
        "میدان ونک" to Offset(centerX + 140f * scale, centerY - 40f * scale),
        "صادقیه" to Offset(centerX - 180f * scale, centerY + 130f * scale),
        "پونک" to Offset(centerX - 190f * scale, centerY - 230f * scale),
        "تجریش" to Offset(centerX + 60f * scale, centerY - 280f * scale),
        "ستارخان" to Offset(centerX - 60f * scale, centerY + 90f * scale),
        "نازی‌آباد" to Offset(centerX + 20f * scale, centerY + 240f * scale)
    )

    labels.forEach { (text, pos) ->
        drawContext.canvas.nativeCanvas.drawText(text, pos.x, pos.y, paint)
    }
}

private fun DrawScope.drawUserBeacon(centerX: Float, centerY: Float, scale: Float) {
    val beaconRadius = 14f * scale

    // Halo Shadow
    drawCircle(
        color = Blue500.copy(alpha = 0.2f),
        radius = beaconRadius * 2.2f,
        center = Offset(centerX, centerY)
    )
    // White Outer Ring
    drawCircle(
        color = Color.White,
        radius = beaconRadius,
        center = Offset(centerX, centerY)
    )
    // Vibrant Blue Center
    drawCircle(
        color = Color(0xFF2563EB),
        radius = beaconRadius * 0.72f,
        center = Offset(centerX, centerY)
    )
    // Center Glint Dot
    drawCircle(
        color = Color.White,
        radius = beaconRadius * 0.25f,
        center = Offset(centerX - beaconRadius * 0.2f, centerY - beaconRadius * 0.2f)
    )
}

private fun DrawScope.drawJobPin(pinX: Float, pinY: Float, job: Job, isSelected: Boolean, scale: Float) {
    val pinRadius = if (isSelected) 18f * scale else 13f * scale
    val pinColor = if (job.isUrgent) Color(0xFFEF4444) else Color(0xFFF97316) // Vibrant Orange

    // 1. Drop shadow
    drawCircle(
        color = Color.Black.copy(alpha = 0.25f),
        radius = pinRadius * 0.9f,
        center = Offset(pinX, pinY + 6f * scale)
    )

    // 2. White outer casing
    drawCircle(
        color = if (isSelected) Navy900 else Color.White,
        radius = pinRadius,
        center = Offset(pinX, pinY)
    )

    // 3. Inner vibrant gradient pin
    drawCircle(
        color = pinColor,
        radius = pinRadius * 0.76f,
        center = Offset(pinX, pinY)
    )

    // 4. White core dot
    drawCircle(
        color = Color.White,
        radius = pinRadius * 0.28f,
        center = Offset(pinX, pinY)
    )

    // 5. Floating Badge if selected or close zoom
    if (scale >= 0.9f) {
        val labelPaint = android.graphics.Paint().apply {
            isAntiAlias = true
            textSize = (10f * scale).coerceIn(8f, 14f)
            color = android.graphics.Color.WHITE
            typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
            textAlign = android.graphics.Paint.Align.CENTER
        }

        val priceStr = PriceFormatter.formatToman(job.salaryToman).replace(" تومان", "")
        val badgeW = (priceStr.length * 7f + 20f) * scale
        val badgeH = 18f * scale
        val badgeTop = pinY - pinRadius - badgeH - 3f

        drawRoundRect(
            color = if (isSelected) Navy900 else Color(0xFFEA580C),
            topLeft = Offset(pinX - badgeW / 2f, badgeTop),
            size = Size(badgeW, badgeH),
            cornerRadius = CornerRadius(6f * scale, 6f * scale)
        )
        drawContext.canvas.nativeCanvas.drawText(
            priceStr,
            pinX,
            badgeTop + badgeH * 0.72f,
            labelPaint
        )
    }
}

private fun DrawScope.drawWorkerPin(pinX: Float, pinY: Float, worker: WorkerProfile, isSelected: Boolean, scale: Float) {
    val pinRadius = if (isSelected) 18f * scale else 13f * scale
    val greenColor = Color(0xFF059669) // Emerald 600

    // 1. Drop shadow
    drawCircle(
        color = Color.Black.copy(alpha = 0.25f),
        radius = pinRadius * 0.9f,
        center = Offset(pinX, pinY + 6f * scale)
    )

    // 2. White outer casing
    drawCircle(
        color = if (isSelected) Navy900 else Color.White,
        radius = pinRadius,
        center = Offset(pinX, pinY)
    )

    // 3. Green beacon
    drawCircle(
        color = if (worker.isAvailableNow) greenColor else Color(0xFF64748B),
        radius = pinRadius * 0.76f,
        center = Offset(pinX, pinY)
    )

    // 4. White core dot
    drawCircle(
        color = Color.White,
        radius = pinRadius * 0.28f,
        center = Offset(pinX, pinY)
    )

    // 5. Worker Name Floating Badge if scale >= 0.9
    if (scale >= 0.9f) {
        val labelPaint = android.graphics.Paint().apply {
            isAntiAlias = true
            textSize = (10f * scale).coerceIn(8f, 14f)
            color = android.graphics.Color.WHITE
            typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
            textAlign = android.graphics.Paint.Align.CENTER
        }

        val nameStr = worker.fullName.take(12)
        val badgeW = (nameStr.length * 8f + 20f) * scale
        val badgeH = 18f * scale
        val badgeTop = pinY - pinRadius - badgeH - 3f

        drawRoundRect(
            color = if (isSelected) Navy900 else greenColor,
            topLeft = Offset(pinX - badgeW / 2f, badgeTop),
            size = Size(badgeW, badgeH),
            cornerRadius = CornerRadius(6f * scale, 6f * scale)
        )
        drawContext.canvas.nativeCanvas.drawText(
            nameStr,
            pinX,
            badgeTop + badgeH * 0.72f,
            labelPaint
        )
    }
}

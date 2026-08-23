package com.karvin.app.presentation.map

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Engineering
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Blue500
import com.karvin.app.presentation.theme.Emerald500
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.Red500
import kotlin.math.sqrt

sealed class MapItem {
    data class JobItem(val job: Job) : MapItem()
    data class WorkerItem(val worker: WorkerProfile) : MapItem()
}

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
    var scale by remember { mutableFloatStateOf(1f) }
    var offsetX by remember { mutableFloatStateOf(0f) }
    var offsetY by remember { mutableFloatStateOf(0f) }

    // Map styling colors
    val mapBg = MaterialTheme.colorScheme.surfaceVariant
    val gridLineColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)
    val roadColor = Color(0xFFCBD5E1).copy(alpha = 0.7f)
    val radiusCircleColor = Emerald600.copy(alpha = 0.08f)
    val radiusStrokeColor = Emerald600.copy(alpha = 0.3f)

    Box(modifier = modifier.fillMaxSize()) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectTransformGestures { _, pan, zoom, _ ->
                        scale = (scale * zoom).coerceIn(0.6f, 3.0f)
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
                            val pinX = centerX + (lonDiff * 8000f * scale).toFloat()
                            val pinY = centerY - (latDiff * 8000f * scale).toFloat()

                            val dist = sqrt((tapOffset.x - pinX) * (tapOffset.x - pinX) + (tapOffset.y - pinY) * (tapOffset.y - pinY))
                            if (dist < 40f) {
                                onJobSelected(job)
                                return@detectTapGestures
                            }
                        }

                        // Check tapped workers
                        workers.forEach { worker ->
                            val latDiff = (worker.latitude ?: userLocation.latitude) - userLocation.latitude
                            val lonDiff = (worker.longitude ?: userLocation.longitude) - userLocation.longitude
                            val pinX = centerX + (lonDiff * 8000f * scale).toFloat()
                            val pinY = centerY - (latDiff * 8000f * scale).toFloat()

                            val dist = sqrt((tapOffset.x - pinX) * (tapOffset.x - pinX) + (tapOffset.y - pinY) * (tapOffset.y - pinY))
                            if (dist < 40f) {
                                onWorkerSelected(worker)
                                return@detectTapGestures
                            }
                        }
                    }
                }
        ) {
            val centerX = size.width / 2f + offsetX
            val centerY = size.height / 2f + offsetY

            // Draw Background terrain
            drawRect(color = mapBg)

            // Draw Simulated City Roads / Grid
            val gridSize = 80f * scale
            val startX = (offsetX % gridSize)
            val startY = (offsetY % gridSize)

            var curX = startX
            while (curX < size.width) {
                drawLine(
                    color = roadColor,
                    start = Offset(curX, 0f),
                    end = Offset(curX, size.height),
                    strokeWidth = 3f * scale
                )
                curX += gridSize
            }

            var curY = startY
            while (curY < size.height) {
                drawLine(
                    color = roadColor,
                    start = Offset(0f, curY),
                    end = Offset(size.width, curY),
                    strokeWidth = 3f * scale
                )
                curY += gridSize
            }

            // Draw Highway Curves (Simulating Tehran Modares / Hemmat Highways)
            val path1 = Path().apply {
                moveTo(0f, centerY - 100f * scale)
                cubicTo(
                    centerX - 100f * scale, centerY - 150f * scale,
                    centerX + 150f * scale, centerY + 50f * scale,
                    size.width, centerY + 80f * scale
                )
            }
            drawPath(path = path1, color = Color(0xFFFDE68A), style = Stroke(width = 6f * scale))

            val path2 = Path().apply {
                moveTo(centerX - 120f * scale, 0f)
                cubicTo(
                    centerX - 80f * scale, centerY - 60f * scale,
                    centerX + 60f * scale, centerY + 140f * scale,
                    centerX + 180f * scale, size.height
                )
            }
            drawPath(path = path2, color = Color(0xFFFDE68A), style = Stroke(width = 6f * scale))

            // Draw Radar / Proximity Radius Circle around user
            drawCircle(
                color = radiusCircleColor,
                radius = 180f * scale,
                center = Offset(centerX, centerY)
            )
            drawCircle(
                color = radiusStrokeColor,
                radius = 180f * scale,
                center = Offset(centerX, centerY),
                style = Stroke(width = 2f, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(15f, 15f)))
            )

            // Draw User GPS Location Dot (Pulse & Blue Beacon)
            drawCircle(
                color = Blue500.copy(alpha = 0.25f),
                radius = 24f * scale,
                center = Offset(centerX, centerY)
            )
            drawCircle(
                color = Color.White,
                radius = 12f * scale,
                center = Offset(centerX, centerY)
            )
            drawCircle(
                color = Blue500,
                radius = 8f * scale,
                center = Offset(centerX, centerY)
            )

            // Draw Job Markers (Pins with red/green/navy colors)
            jobs.forEach { job ->
                val latDiff = (job.latitude ?: userLocation.latitude) - userLocation.latitude
                val lonDiff = (job.longitude ?: userLocation.longitude) - userLocation.longitude
                val pinX = centerX + (lonDiff * 8000f * scale).toFloat()
                val pinY = centerY - (latDiff * 8000f * scale).toFloat()

                val isSelected = selectedJob?.id == job.id
                val pinColor = if (job.isUrgent) Red500 else if (job.categoryId == "cat_1") Amber500 else Emerald600
                val pinRadius = if (isSelected) 18f * scale else 13f * scale

                // Marker shadow
                drawCircle(
                    color = Color.Black.copy(alpha = 0.2f),
                    radius = pinRadius * 0.9f,
                    center = Offset(pinX, pinY + 6f * scale)
                )
                // Outer ring
                drawCircle(
                    color = if (isSelected) Navy900 else Color.White,
                    radius = pinRadius,
                    center = Offset(pinX, pinY)
                )
                // Inner solid pin
                drawCircle(
                    color = pinColor,
                    radius = pinRadius * 0.75f,
                    center = Offset(pinX, pinY)
                )
            }

            // Draw Worker Markers (Pins with Green / Avatar representation)
            workers.forEach { worker ->
                val latDiff = (worker.latitude ?: userLocation.latitude) - userLocation.latitude
                val lonDiff = (worker.longitude ?: userLocation.longitude) - userLocation.longitude
                val pinX = centerX + (lonDiff * 8000f * scale).toFloat()
                val pinY = centerY - (latDiff * 8000f * scale).toFloat()

                val isSelected = selectedWorker?.userId == worker.userId
                val pinRadius = if (isSelected) 18f * scale else 13f * scale

                // Shadow
                drawCircle(
                    color = Color.Black.copy(alpha = 0.2f),
                    radius = pinRadius * 0.9f,
                    center = Offset(pinX, pinY + 6f * scale)
                )
                // Outer ring
                drawCircle(
                    color = if (isSelected) Emerald600 else Color.White,
                    radius = pinRadius,
                    center = Offset(pinX, pinY)
                )
                // Inner green beacon (available worker)
                drawCircle(
                    color = if (worker.isAvailableNow) Emerald500 else Navy900,
                    radius = pinRadius * 0.75f,
                    center = Offset(pinX, pinY)
                )
            }
        }

        // Recenter GPS Floating Action Button
        FloatingActionButton(
            onClick = {
                scale = 1f
                offsetX = 0f
                offsetY = 0f
            },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .clip(CircleShape),
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = Navy900
        ) {
            Icon(Icons.Default.MyLocation, contentDescription = "Recenter Map")
        }
    }
}

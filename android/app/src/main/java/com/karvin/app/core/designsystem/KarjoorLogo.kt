package com.karvin.app.core.designsystem

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

private const val LogoViewport = 48f

/**
 * Draws the KARJOOR mark into a [DrawScope].
 *
 * Two independent strokes converge onto a shared spine; the negative space between
 * the arms reads as "K". Geometry is expressed in a 48x48 unit space and scaled to
 * the canvas, so the same code serves a 24dp chip and a 108dp splash.
 *
 * @param reveal 0f draws only the spine, 1f draws the fully converged mark.
 */
private fun DrawScope.drawKarjoorMark(
    spineColor: Color,
    requesterColor: Color,
    performerColor: Color,
    reveal: Float = 1f,
) {
    val unit = size.minDimension / LogoViewport
    val strokeWidth = 5f * unit
    val armExtent = 0.35f + 0.65f * reveal.coerceIn(0f, 1f)
    val armReach = 22f * armExtent

    // Shared spine — the single unified backbone both paths meet on.
    drawLine(
        color = spineColor,
        start = Offset(14f * unit, 8f * unit),
        end = Offset(14f * unit, 40f * unit),
        strokeWidth = strokeWidth,
        cap = StrokeCap.Round,
    )

    // Requester arm — upper branch, converging onto the spine.
    val requesterArm = Path().apply {
        moveTo(14f * unit, 21f * unit)
        cubicTo(
            14f * unit + armReach * 0.36f * unit, 19f * unit,
            14f * unit + armReach * 0.73f * unit, 15f * unit,
            14f * unit + armReach * unit, 10f * unit,
        )
    }
    drawPath(
        path = requesterArm,
        color = requesterColor,
        style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
    )

    // Performer arm — lower branch, converging onto the spine.
    val performerArm = Path().apply {
        moveTo(14f * unit, 26f * unit)
        cubicTo(
            14f * unit + armReach * 0.36f * unit, 28f * unit,
            14f * unit + armReach * 0.73f * unit, 33f * unit,
            14f * unit + armReach * unit, 38f * unit,
        )
    }
    drawPath(
        path = performerArm,
        color = performerColor,
        style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
    )

    // Convergence node: appears only once the arms have fully met.
    val nodeAlpha = ((reveal - 0.75f) / 0.25f).coerceIn(0f, 1f)
    if (nodeAlpha > 0f) {
        drawCircle(
            color = KarjoorColors.AccentCoral.copy(alpha = nodeAlpha),
            radius = 3.2f * unit,
            center = Offset(14f * unit + armReach * unit, 24f * unit),
        )
    }
}

/**
 * Static KARJOOR mark. Vector-native, so it stays crisp at any density.
 */
@Composable
fun KarjoorMark(
    modifier: Modifier = Modifier,
    size: Dp = 40.dp,
    spineColor: Color = KarjoorColors.Navy,
    requesterColor: Color = KarjoorColors.Primary,
    performerColor: Color = KarjoorColors.Secondary,
) {
    Box(
        modifier = modifier
            .size(size)
            .semantics { contentDescription = "کارجور" },
    ) {
        Canvas(Modifier.size(size)) {
            drawKarjoorMark(spineColor, requesterColor, performerColor)
        }
    }
}

/**
 * KARJOOR horizontal lockup: the mark plus the Persian wordmark.
 *
 * [showSubtitle] adds the Latin name beneath, used on splash and role selection
 * where the brand states itself fully.
 */
@Composable
fun KarjoorLogo(
    modifier: Modifier = Modifier,
    markSize: Dp = 40.dp,
    showSubtitle: Boolean = false,
    wordmarkColor: Color = KarjoorColors.TextPrimary,
) {
    Row(
        modifier = modifier.semantics { contentDescription = "کارجور" },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing12),
    ) {
        KarjoorMark(size = markSize)
        Column {
            Text(
                text = "کارجور",
                style = MaterialTheme.typography.headlineMedium,
                color = wordmarkColor,
            )
            if (showSubtitle) {
                Text(
                    text = "KARJOOR",
                    style = MaterialTheme.typography.labelSmall,
                    color = KarjoorColors.TextSecondary,
                )
            }
        }
    }
}

/**
 * Animated splash mark: the two arms grow out of the spine and converge.
 * Duration is deliberately short so a heavy animation never delays first paint.
 */
@Composable
fun KarjoorSplashMark(
    modifier: Modifier = Modifier,
    size: Dp = 96.dp,
) {
    val transition = rememberInfiniteTransition(label = "karjoor-splash")
    val reveal by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "karjoor-splash-reveal",
    )

    Box(
        modifier = modifier
            .size(size)
            .semantics { contentDescription = "کارجور" },
    ) {
        Canvas(Modifier.size(size)) {
            drawKarjoorMark(
                spineColor = KarjoorColors.Navy,
                requesterColor = KarjoorColors.Primary,
                performerColor = KarjoorColors.Secondary,
                reveal = reveal,
            )
        }
    }
}

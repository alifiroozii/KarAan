package com.karvin.app.core.designsystem

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

private const val LogoViewport = 48f

/**
 * Draws the authentic Persian KARJOOR / کارجو mark into a [DrawScope].
 *
 * An interconnected Persian calligraphic emblem representing the dynamic union
 * of Requester (Sapphire Blue) and Performer (Emerald Green) meeting at a golden
 * synergy node. Zero Latin 'K' reference — pure Persian fluid geometry.
 *
 * @param reveal 0f to 1f animation progress.
 */
private fun DrawScope.drawKarjoorMark(
    spineColor: Color,
    requesterColor: Color,
    performerColor: Color,
    reveal: Float = 1f,
) {
    val unit = size.minDimension / LogoViewport
    val strokeWidth = 5.2f * unit
    val progress = reveal.coerceIn(0.1f, 1f)

    // Blue Synergy Wing (Requester & Task Platform)
    val upperArc = Path().apply {
        moveTo(12f * unit, 18f * unit)
        cubicTo(
            12f * unit, 11f * unit,
            22f * unit, 8f * unit,
            28f * unit * progress, 11f * unit,
        )
        if (progress > 0.4f) {
            cubicTo(
                34f * unit, 14f * unit,
                36f * unit, 20f * unit,
                33f * unit, 26f * unit,
            )
        }
        if (progress > 0.7f) {
            cubicTo(
                30f * unit, 32f * unit,
                20f * unit, 38f * unit,
                14f * unit, 38f * unit,
            )
        }
    }
    drawPath(
        path = upperArc,
        color = requesterColor,
        style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
    )

    // Emerald Synergy Wing (Specialist & Skill Fulfillment)
    val lowerArc = Path().apply {
        moveTo(36f * unit, 30f * unit)
        cubicTo(
            36f * unit, 37f * unit,
            26f * unit, 40f * unit,
            20f * unit * progress, 37f * unit,
        )
        if (progress > 0.4f) {
            cubicTo(
                14f * unit, 34f * unit,
                12f * unit, 28f * unit,
                15f * unit, 22f * unit,
            )
        }
        if (progress > 0.7f) {
            cubicTo(
                18f * unit, 16f * unit,
                28f * unit, 10f * unit,
                34f * unit, 10f * unit,
            )
        }
    }
    drawPath(
        path = lowerArc,
        color = performerColor,
        style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
    )

    // Central Radiant Matching Spark (Golden Amber)
    if (progress > 0.6f) {
        val alpha = ((progress - 0.6f) / 0.4f).coerceIn(0f, 1f)
        val sparkPath = Path().apply {
            moveTo(24f * unit, 19f * unit)
            lineTo(25.5f * unit, 22.5f * unit)
            lineTo(29f * unit, 24f * unit)
            lineTo(25.5f * unit, 25.5f * unit)
            lineTo(24f * unit, 29f * unit)
            lineTo(22.5f * unit, 25.5f * unit)
            lineTo(19f * unit, 24f * unit)
            lineTo(22.5f * unit, 22.5f * unit)
            close()
        }
        drawPath(
            path = sparkPath,
            color = Color(0xFFF59E0B).copy(alpha = alpha),
        )
    }
}

/**
 * Static KARJOOR mark. Renders the modern Gemini-designed synergy emblem without Latin 'K'.
 */
@Composable
fun KarjoorMark(
    modifier: Modifier = Modifier,
    size: Dp = 40.dp,
    spineColor: Color = KarjoorColors.Navy,
    requesterColor: Color = KarjoorColors.Primary,
    performerColor: Color = KarjoorColors.Secondary,
) {
    Image(
        painter = painterResource(id = com.karvin.app.R.drawable.karjoor_logo),
        contentDescription = "کارجور",
        modifier = modifier
            .size(size)
            .clip(RoundedCornerShape(size * 0.22f)),
        contentScale = ContentScale.Fit,
    )
}

/**
 * KARJOOR horizontal lockup: the mark plus the Persian wordmark.
 *
 * [showSubtitle] adds the Persian subtitle beneath.
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
                fontWeight = FontWeight.Bold,
                color = wordmarkColor,
            )
            if (showSubtitle) {
                Text(
                    text = "سامانه هوشمند اشتغال و خدمات",
                    style = MaterialTheme.typography.labelSmall,
                    color = KarjoorColors.TextSecondary,
                )
            }
        }
    }
}

/**
 * Animated splash mark: renders the Gemini emblem with a pulsing scale and soft glow.
 */
@Composable
fun KarjoorSplashMark(
    modifier: Modifier = Modifier,
    size: Dp = 104.dp,
) {
    val transition = rememberInfiniteTransition(label = "karjoor-splash")
    val pulse by transition.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "karjoor-splash-pulse",
    )

    Box(
        modifier = modifier
            .size(size)
            .scale(pulse)
            .semantics { contentDescription = "کارجور" },
        contentAlignment = Alignment.Center,
    ) {
        Image(
            painter = painterResource(id = com.karvin.app.R.drawable.karjoor_logo),
            contentDescription = "کارجور",
            modifier = Modifier
                .size(size)
                .clip(RoundedCornerShape(size * 0.22f)),
            contentScale = ContentScale.Fit,
        )
    }
}

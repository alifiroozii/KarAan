package com.karvin.app.core.designsystem

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * KARJOOR async states.
 *
 * Every list or dashboard can be in one of four states — loading, empty, error,
 * offline — and each has a designed representation here. Screens must render these
 * rather than inventing per-screen placeholders, so a loading feed looks the same
 * everywhere.
 */

/** Shimmering placeholder block. */
@Composable
fun KarjoorSkeletonBox(
    modifier: Modifier = Modifier,
    height: Dp = 16.dp,
    cornerRadius: Dp = KarjoorDimensions.cornerSmall,
) {
    val transition = rememberInfiniteTransition(label = "karjoor-shimmer")
    val alpha by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.75f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 900, easing = LinearEasing),
        ),
        label = "karjoor-shimmer-alpha",
    )
    Box(
        modifier
            .height(height)
            .alpha(alpha)
            .background(
                color = KarjoorColors.SurfaceVariant,
                shape = RoundedCornerShape(cornerRadius),
            ),
    )
}

/** Skeleton list standing in for a loading feed. */
@Composable
fun KarjoorSkeletonList(modifier: Modifier = Modifier, count: Int = 4) {
    Column(
        modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing12),
    ) {
        repeat(count) {
            KarjoorCard {
                Column(
                    Modifier.padding(KarjoorDimensions.spacing16),
                    verticalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing12),
                ) {
                    KarjoorSkeletonBox(Modifier.fillMaxWidth(0.55f), 18.dp)

/**
 * Empty state. Always explains what is missing and offers the next action so the
 * screen never dead-ends.
 */
@Composable
fun KarjoorEmptyState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    actionText: String? = null,
    onAction: (() -> Unit)? = null,
) {
    Column(
        modifier
            .fillMaxWidth()
            .padding(KarjoorDimensions.spacing32),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing12),
    ) {
        if (icon != null) {
            Surface(
                shape = RoundedCornerShape(KarjoorDimensions.cornerLarge),
                color = KarjoorColors.PrimarySoft,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = KarjoorColors.Primary,
                    modifier = Modifier
                        .padding(KarjoorDimensions.spacing16)
                        .size(28.dp),
                )
            }
        }
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = KarjoorColors.TextPrimary,
            textAlign = TextAlign.Center,
        )
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = KarjoorColors.TextSecondary,
            textAlign = TextAlign.Center,
        )
        if (actionText != null && onAction != null) {
            KarjoorSecondaryButton(actionText, onAction)
        }
    }
}

/** Error state with retry. */
@Composable
fun KarjoorErrorState(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    KarjoorEmptyState(
        title = "مشکلی پیش آمد",
        message = message,
        modifier = modifier,
        actionText = "تلاش دوباره",
        onAction = onRetry,
    )
}

/** Offline banner shown when displayed data may be stale. */
@Composable
fun KarjoorOfflineBanner(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = KarjoorColors.WarningSoft,
        shape = RoundedCornerShape(KarjoorDimensions.cornerSmall),
    ) {
        Text(
            text = "اتصال اینترنت قطع است. اطلاعات نمایش‌داده‌شده ممکن است قدیمی باشد.",
            modifier = Modifier.padding(
                horizontal = KarjoorDimensions.spacing12,
                vertical = KarjoorDimensions.spacing8,
            ),
            style = MaterialTheme.typography.labelMedium,
            color = KarjoorColors.Warning,
        )
    }
}

                    KarjoorSkeletonBox(Modifier.fillMaxWidth(), 12.dp)
                    Row(horizontalArrangement = Arrangement.spacedBy(KarjoorDimensions.spacing12)) {
                        KarjoorSkeletonBox(Modifier.fillMaxWidth(0.28f), 12.dp)
                        KarjoorSkeletonBox(Modifier.fillMaxWidth(0.28f), 12.dp)
                    }
                }
            }
        }
    }
}

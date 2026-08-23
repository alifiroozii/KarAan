package com.karvin.app.presentation.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.karvin.app.R
import com.karvin.app.presentation.theme.Emerald500
import com.karvin.app.presentation.theme.Navy900

@Composable
fun KarvinLogo(
    modifier: Modifier = Modifier,
    size: Dp = 100.dp,
    showText: Boolean = true,
    showSlogan: Boolean = true,
    animated: Boolean = false,
    textColor: Color = MaterialTheme.colorScheme.onBackground
) {
    val scale = if (animated) {
        val infiniteTransition = rememberInfiniteTransition(label = "logo_pulse")
        val animatedScale by infiniteTransition.animateFloat(
            initialValue = 0.96f,
            targetValue = 1.04f,
            animationSpec = infiniteRepeatable(
                animation = tween(1400, easing = FastOutSlowInEasing),
                repeatMode = RepeatMode.Reverse
            ),
            label = "scale"
        )
        animatedScale
    } else {
        1f
    }

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(size)
                .scale(scale)
                .clip(RoundedCornerShape(size * 0.28f))
                .background(Navy900),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.ic_karvin_logo),
                contentDescription = "KARVIN Logo",
                modifier = Modifier.size(size * 0.85f)
            )
        }

        if (showText) {
            Spacer(modifier = Modifier.height(14.dp))
            Text(
                text = stringResource(id = R.string.app_name),
                style = MaterialTheme.typography.displayMedium,
                fontWeight = FontWeight.Bold,
                color = textColor
            )
        }

        if (showSlogan) {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = stringResource(id = R.string.brand_slogan),
                style = MaterialTheme.typography.bodyMedium,
                color = Emerald500,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

package com.karvin.app.presentation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.karvin.app.presentation.theme.BorderLight

@Composable
fun KarvinCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    backgroundColor: Color = MaterialTheme.colorScheme.surface,
    borderColor: Color = BorderLight,
    elevation: Dp = 1.dp,
    shapeRadius: Dp = 16.dp,
    content: @Composable ColumnScope.() -> Unit
) {
    val shape = RoundedCornerShape(shapeRadius)
    val cardModifier = if (onClick != null) {
        modifier
            .clip(shape)
            .clickable { onClick() }
    } else {
        modifier
    }

    Card(
        modifier = cardModifier,
        shape = shape,
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        border = BorderStroke(1.dp, borderColor),
        elevation = CardDefaults.cardElevation(defaultElevation = elevation),
        content = content
    )
}

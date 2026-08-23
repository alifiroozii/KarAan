package com.karvin.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.karvin.app.presentation.theme.BorderLight
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald700
import com.karvin.app.presentation.theme.Navy100
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight

@Composable
fun KarvinFilterChip(
    text: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null
) {
    val backgroundColor = if (isSelected) Navy900 else MaterialTheme.colorScheme.surface
    val textColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
    val borderColor = if (isSelected) Navy900 else BorderLight

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(backgroundColor)
            .border(1.dp, borderColor, RoundedCornerShape(20.dp))
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = textColor
                )
                Spacer(modifier = Modifier.width(6.dp))
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = textColor
            )
        }
    }
}

@Composable
fun KarvinSkillBadge(
    text: String,
    modifier: Modifier = Modifier,
    isHighlighted: Boolean = false
) {
    val bg = if (isHighlighted) Emerald100 else Navy100
    val textCol = if (isHighlighted) Emerald700 else Navy900

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bg)
            .padding(horizontal = 10.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Medium,
            color = textCol
        )
    }
}

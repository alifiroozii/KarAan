package com.karvin.app.presentation.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.Red500

enum class KarvinButtonType {
    PRIMARY,
    SECONDARY,
    OUTLINED,
    DANGER
}

@Composable
fun KarvinButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    type: KarvinButtonType = KarvinButtonType.PRIMARY,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    icon: ImageVector? = null,
    height: Dp = 52.dp,
    shapeRadius: Dp = 14.dp
) {
    val shape = RoundedCornerShape(shapeRadius)

    when (type) {
        KarvinButtonType.PRIMARY -> {
            Button(
                onClick = onClick,
                modifier = modifier
                    .fillMaxWidth()
                    .height(height),
                enabled = enabled && !isLoading,
                shape = shape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Navy900,
                    contentColor = Color.White
                ),
                contentPadding = PaddingValues(horizontal = 16.dp)
            ) {
                ButtonContent(text = text, icon = icon, isLoading = isLoading, contentColor = Color.White)
            }
        }
        KarvinButtonType.SECONDARY -> {
            Button(
                onClick = onClick,
                modifier = modifier
                    .fillMaxWidth()
                    .height(height),
                enabled = enabled && !isLoading,
                shape = shape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Emerald600,
                    contentColor = Color.White
                ),
                contentPadding = PaddingValues(horizontal = 16.dp)
            ) {
                ButtonContent(text = text, icon = icon, isLoading = isLoading, contentColor = Color.White)
            }
        }
        KarvinButtonType.OUTLINED -> {
            OutlinedButton(
                onClick = onClick,
                modifier = modifier
                    .fillMaxWidth()
                    .height(height),
                enabled = enabled && !isLoading,
                shape = shape,
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.primary
                ),
                contentPadding = PaddingValues(horizontal = 16.dp)
            ) {
                ButtonContent(text = text, icon = icon, isLoading = isLoading, contentColor = MaterialTheme.colorScheme.primary)
            }
        }
        KarvinButtonType.DANGER -> {
            Button(
                onClick = onClick,
                modifier = modifier
                    .fillMaxWidth()
                    .height(height),
                enabled = enabled && !isLoading,
                shape = shape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Red500,
                    contentColor = Color.White
                ),
                contentPadding = PaddingValues(horizontal = 16.dp)
            ) {
                ButtonContent(text = text, icon = icon, isLoading = isLoading, contentColor = Color.White)
            }
        }
    }
}

@Composable
private fun ButtonContent(
    text: String,
    icon: ImageVector?,
    isLoading: Boolean,
    contentColor: Color
) {
    if (isLoading) {
        CircularProgressIndicator(
            modifier = Modifier.size(22.dp),
            color = contentColor,
            strokeWidth = 2.5.dp
        )
    } else {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = contentColor
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                color = contentColor
            )
        }
    }
}

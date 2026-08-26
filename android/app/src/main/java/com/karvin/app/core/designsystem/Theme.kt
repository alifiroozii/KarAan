package com.karvin.app.core.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val LightColors = lightColorScheme(
    primary = Color(0xFF0E5961),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFB8E6E7),
    onPrimaryContainer = Color(0xFF002F34),
    secondary = Color(0xFFB86B2C),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFFFDCC2),
    onSecondaryContainer = Color(0xFF3A1800),
    tertiary = Color(0xFF5A5D8D),
    background = Color(0xFFF8FAF9),
    surface = Color(0xFFF8FAF9),
    surfaceVariant = Color(0xFFDDE5E3),
    outline = Color(0xFF71807E),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF85CED1),
    onPrimary = Color(0xFF00373C),
    primaryContainer = Color(0xFF0D4F56),
    onPrimaryContainer = Color(0xFFB8E6E7),
    secondary = Color(0xFFFFB978),
    onSecondary = Color(0xFF542900),
    secondaryContainer = Color(0xFF7D4616),
    onSecondaryContainer = Color(0xFFFFDCC2),
    tertiary = Color(0xFFC1C3F8),
    background = Color(0xFF0F1414),
    surface = Color(0xFF0F1414),
    surfaceVariant = Color(0xFF3E4948),
    outline = Color(0xFF899391),
)

@Composable
fun KarvinTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = androidx.compose.material3.Typography(
            displaySmall = androidx.compose.material3.Typography().displaySmall.copy(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            headlineSmall = androidx.compose.material3.Typography().headlineSmall.copy(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            titleLarge = androidx.compose.material3.Typography().titleLarge.copy(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            titleMedium = androidx.compose.material3.Typography().titleMedium.copy(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, letterSpacing = 0.sp),
            bodyLarge = androidx.compose.material3.Typography().bodyLarge.copy(fontFamily = FontFamily.SansSerif, lineHeight = 28.sp, letterSpacing = 0.sp),
            bodyMedium = androidx.compose.material3.Typography().bodyMedium.copy(fontFamily = FontFamily.SansSerif, lineHeight = 24.sp, letterSpacing = 0.sp),
            labelLarge = androidx.compose.material3.Typography().labelLarge.copy(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, letterSpacing = 0.sp),
        ),
        content = content,
    )
}

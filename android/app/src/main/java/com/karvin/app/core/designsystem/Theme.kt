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
    primary = Color(0xFF12355B),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD7EAF9),
    onPrimaryContainer = Color(0xFF062B4A),
    secondary = Color(0xFF00BFA6),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFCCF5EF),
    onSecondaryContainer = Color(0xFF003A32),
    tertiary = Color(0xFF16A34A),
    background = Color(0xFFFAFAF8),
    surface = Color.White,
    surfaceVariant = Color(0xFFF1F4F5),
    outline = Color(0xFF7A8791),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFFB7A4FF),
    onPrimary = Color(0xFF2A1060),
    primaryContainer = Color(0xFF3F2A78),
    onPrimaryContainer = Color(0xFFE7DEFF),
    secondary = Color(0xFFFFB959),
    onSecondary = Color(0xFF4A2B00),
    secondaryContainer = Color(0xFF5C3D00),
    onSecondaryContainer = Color(0xFFFFDDB3),
    tertiary = Color(0xFF6FDBAF),
    background = Color(0xFF121016),
    surface = Color(0xFF17151C),
    surfaceVariant = Color(0xFF2B2833),
    outline = Color(0xFF948FA3),
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

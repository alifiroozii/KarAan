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

// ── KARVIN brand palette ────────────────────────────────────────────
// Ocean Navy  #12355B  brand / primary actions
// Turquoise   #00BFA6  discovery / map / secondary
// Amber Gold  #FFB703  provider accent
// Emerald     #16A34A  success / online

private val LightColors = lightColorScheme(
    primary = Color(0xFF12355B),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD3E3F4),
    onPrimaryContainer = Color(0xFF062B4A),
    secondary = Color(0xFF00BFA6),
    onSecondary = Color(0xFF00332C),
    secondaryContainer = Color(0xFFCCF5EF),
    onSecondaryContainer = Color(0xFF003A32),
    tertiary = Color(0xFF16A34A),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFDCFCE7),
    onTertiaryContainer = Color(0xFF14532D),
    error = Color(0xFFB3261E),
    onError = Color.White,
    background = Color(0xFFF7F8FC),
    onBackground = Color(0xFF111827),
    surface = Color.White,
    onSurface = Color(0xFF111827),
    surfaceVariant = Color(0xFFEEF1F6),
    onSurfaceVariant = Color(0xFF6B7280),
    outline = Color(0xFF9AA4B2),
    outlineVariant = Color(0xFFD9DEE7),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF8FB8E8),
    onPrimary = Color(0xFF0B2440),
    primaryContainer = Color(0xFF1B4470),
    onPrimaryContainer = Color(0xFFD3E3F4),
    secondary = Color(0xFF2BD9C0),
    onSecondary = Color(0xFF00332C),
    secondaryContainer = Color(0xFF00514A),
    onSecondaryContainer = Color(0xFFB8F1E8),
    tertiary = Color(0xFF6FDB8F),
    onTertiary = Color(0xFF0B3D1F),
    tertiaryContainer = Color(0xFF14532D),
    onTertiaryContainer = Color(0xFFDCFCE7),
    error = Color(0xFFF2B8B5),
    onError = Color(0xFF601410),
    background = Color(0xFF10151C),
    onBackground = Color(0xFFE5E9EF),
    surface = Color(0xFF161C24),
    onSurface = Color(0xFFE5E9EF),
    surfaceVariant = Color(0xFF222B36),
    onSurfaceVariant = Color(0xFF9AA4B2),
    outline = Color(0xFF5A6572),
    outlineVariant = Color(0xFF2E3844),
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

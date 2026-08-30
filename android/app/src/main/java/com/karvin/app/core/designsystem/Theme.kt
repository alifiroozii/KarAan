package com.karvin.app.core.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.googlefonts.Font
import androidx.compose.ui.text.googlefonts.GoogleFont
import androidx.compose.ui.unit.sp
import com.karvin.app.R

private val fontProvider = GoogleFont.Provider(
    providerAuthority = "com.google.android.gms.fonts",
    providerPackage = "com.google.android.gms",
    certificates = R.array.com_google_android_gms_fonts_certs,
)

private val vazirmatnName = GoogleFont("Vazirmatn")

val VazirmatnFamily = FontFamily(
    Font(googleFont = vazirmatnName, fontProvider = fontProvider, weight = FontWeight.Normal),
    Font(googleFont = vazirmatnName, fontProvider = fontProvider, weight = FontWeight.Medium),
    Font(googleFont = vazirmatnName, fontProvider = fontProvider, weight = FontWeight.SemiBold),
    Font(googleFont = vazirmatnName, fontProvider = fontProvider, weight = FontWeight.Bold),
)

private val LightColors = lightColorScheme(
    primary = KarvinLightPrimary,
    scrim = Color(0x66000000),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFEFF6FF),
    onPrimaryContainer = Color(0xFF1E3A8A),
    secondary = KarvinLightSecondary,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFCCFBF1),
    onSecondaryContainer = Color(0xFF115E59),
    tertiary = KarvinLightTertiary,
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFD1FAE5),
    onTertiaryContainer = Color(0xFF065F46),
    error = Color(0xFFDC2626),
    onError = Color.White,
    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF0F172A),
    surface = Color.White,
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = Color(0xFF64748B),
    outline = Color(0xFFCBD5E1),
    outlineVariant = Color(0xFFE2E8F0),
)

private val DarkColors = darkColorScheme(
    primary = KarvinDarkPrimary,
    onPrimary = Color(0xFF0F172A),
    primaryContainer = Color(0xFF1E3A8A),
    onPrimaryContainer = Color(0xFFDBEAFE),
    secondary = KarvinDarkSecondary,
    onSecondary = Color(0xFF042F2E),
    secondaryContainer = Color(0xFF115E59),
    onSecondaryContainer = Color(0xFFCCFBF1),
    tertiary = KarvinDarkTertiary,
    onTertiary = Color(0xFF022C22),
    tertiaryContainer = Color(0xFF065F46),
    onTertiaryContainer = Color(0xFFD1FAE5),
    error = Color(0xFFF87171),
    onError = Color(0xFF450A0A),
    background = Color(0xFF0B0F17),
    onBackground = Color(0xFFF8FAFC),
    surface = Color(0xFF151D28),
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF475569),
    outlineVariant = Color(0xFF334155),
)

@Composable
fun KarvinTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = androidx.compose.material3.Typography(
            displaySmall = androidx.compose.material3.Typography().displaySmall.copy(fontFamily = VazirmatnFamily, fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            headlineLarge = androidx.compose.material3.Typography().headlineLarge.copy(fontFamily = VazirmatnFamily, fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            headlineMedium = androidx.compose.material3.Typography().headlineMedium.copy(fontFamily = VazirmatnFamily, fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            headlineSmall = androidx.compose.material3.Typography().headlineSmall.copy(fontFamily = VazirmatnFamily, fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            titleLarge = androidx.compose.material3.Typography().titleLarge.copy(fontFamily = VazirmatnFamily, fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            titleMedium = androidx.compose.material3.Typography().titleMedium.copy(fontFamily = VazirmatnFamily, fontWeight = FontWeight.SemiBold, letterSpacing = 0.sp),
            titleSmall = androidx.compose.material3.Typography().titleSmall.copy(fontFamily = VazirmatnFamily, fontWeight = FontWeight.SemiBold, letterSpacing = 0.sp),
            bodyLarge = androidx.compose.material3.Typography().bodyLarge.copy(fontFamily = VazirmatnFamily, lineHeight = 28.sp, letterSpacing = 0.sp),
            bodyMedium = androidx.compose.material3.Typography().bodyMedium.copy(fontFamily = VazirmatnFamily, lineHeight = 24.sp, letterSpacing = 0.sp),
            bodySmall = androidx.compose.material3.Typography().bodySmall.copy(fontFamily = VazirmatnFamily, lineHeight = 20.sp, letterSpacing = 0.sp),
            labelLarge = androidx.compose.material3.Typography().labelLarge.copy(fontFamily = VazirmatnFamily, fontWeight = FontWeight.SemiBold, letterSpacing = 0.sp),
            labelMedium = androidx.compose.material3.Typography().labelMedium.copy(fontFamily = VazirmatnFamily, fontWeight = FontWeight.Medium, letterSpacing = 0.sp),
            labelSmall = androidx.compose.material3.Typography().labelSmall.copy(fontFamily = VazirmatnFamily, fontWeight = FontWeight.Medium, letterSpacing = 0.sp),
        ),
        content = content,
    )
}


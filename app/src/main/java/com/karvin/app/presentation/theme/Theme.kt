package com.karvin.app.presentation.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.LayoutDirection
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Navy900,
    onPrimary = Color.White,
    primaryContainer = Navy100,
    onPrimaryContainer = Navy900,
    secondary = Emerald600,
    onSecondary = Color.White,
    secondaryContainer = Emerald100,
    onSecondaryContainer = Emerald700,
    tertiary = Cyan600,
    onTertiary = Color.White,
    tertiaryContainer = Cyan100,
    onTertiaryContainer = Cyan600,
    background = BackgroundLight,
    onBackground = TextPrimaryLight,
    surface = SurfaceLight,
    onSurface = TextPrimaryLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = TextSecondaryLight,
    outline = BorderLight,
    error = Red500,
    onError = Color.White
)

private val DarkColorScheme = darkColorScheme(
    primary = Navy100,
    onPrimary = Navy900,
    primaryContainer = Navy800,
    onPrimaryContainer = Navy100,
    secondary = Emerald400,
    onSecondary = Navy900,
    secondaryContainer = Emerald700,
    onSecondaryContainer = Emerald100,
    tertiary = Cyan400,
    onTertiary = Navy900,
    tertiaryContainer = Cyan600,
    onTertiaryContainer = Cyan100,
    background = BackgroundDark,
    onBackground = TextPrimaryDark,
    surface = SurfaceDark,
    onSurface = TextPrimaryDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = TextSecondaryDark,
    outline = BorderDark,
    error = Red500,
    onError = Color.White
)

@Composable
fun KarvinTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    // Force RTL layout direction for Persian support
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = KarvinTypography,
            shapes = KarvinShapes,
            content = content
        )
    }
}

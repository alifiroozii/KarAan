package com.karvin.app.core.designsystem

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.karvin.app.R

/**
 * KARJOOR typography.
 *
 * Vazirmatn is the single family. The hierarchy is deliberately explicit so a
 * screen never invents its own size:
 *
 *  - displaySmall     splash / brand wordmark
 *  - headlineLarge    page title
 *  - headlineSmall    card section title
 *  - titleLarge       card title / job title
 *  - titleMedium      row title
 *  - bodyLarge        primary body copy
 *  - bodyMedium       secondary body copy
 *  - bodySmall        captions, meta, distance
 *  - labelLarge       buttons, money
 *  - labelMedium      chips, badges
 *  - labelSmall       timestamps, tertiary meta
 *
 * Persian text is taller than Latin, so every style sets an explicit line height
 * and trims the extra leading Material would otherwise add.
 */
val VazirmatnFamily = FontFamily(
    Font(R.font.vazirmatn_regular, FontWeight.Normal),
    Font(R.font.vazirmatn_regular, FontWeight.Medium),
    Font(R.font.vazirmatn_bold, FontWeight.SemiBold),
    Font(R.font.vazirmatn_bold, FontWeight.Bold),
    Font(R.font.vazirmatn_bold, FontWeight.ExtraBold),
)

/** Shared line-height behaviour for Persian: centred alignment, no trim surprises. */
private val PersianLineHeightStyle = LineHeightStyle(
    alignment = LineHeightStyle.Alignment.Center,
    trim = LineHeightStyle.Trim.None,
)

private fun persian(
    size: Int,
    lineHeight: Int,
    weight: FontWeight = FontWeight.Normal,
): TextStyle = TextStyle(
    fontFamily = VazirmatnFamily,
    fontWeight = weight,
    fontSize = size.sp,
    lineHeight = lineHeight.sp,
    letterSpacing = 0.sp,
    lineHeightStyle = PersianLineHeightStyle,
)

/** KARJOOR type scale, built on [persian] so sizes and weights stay predictable. */
val KarjoorTypography = Typography(
    displaySmall = persian(32, 46, FontWeight.ExtraBold),
    headlineLarge = persian(24, 38, FontWeight.Bold),
    headlineMedium = persian(20, 32, FontWeight.Bold),
    headlineSmall = persian(18, 30, FontWeight.Bold),
    titleLarge = persian(17, 28, FontWeight.Bold),
    titleMedium = persian(15, 26, FontWeight.SemiBold),
    titleSmall = persian(14, 24, FontWeight.SemiBold),
    bodyLarge = persian(15, 28, FontWeight.Normal),
    bodyMedium = persian(14, 26, FontWeight.Normal),
    bodySmall = persian(12, 22, FontWeight.Normal),
    labelLarge = persian(15, 22, FontWeight.Bold),
    labelMedium = persian(13, 20, FontWeight.Medium),
    labelSmall = persian(11, 18, FontWeight.Medium),
)

/** KARJOOR corner radii. Screens pick from here, never a literal dp value. */
val KarjoorShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(14.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

/**
 * KARJOOR light colour scheme.
 *
 * Light is the only theme in this release. The [darkTheme] parameter is accepted
 * and ignored so existing call sites (which pass a theme mode from settings) keep
 * compiling without silently rendering a half-migrated dark palette.
 */
private val KarjoorLightColors = lightColorScheme(
    primary = KarjoorColors.Primary,
    onPrimary = KarjoorColors.OnPrimary,
    primaryContainer = KarjoorColors.PrimaryContainer,
    onPrimaryContainer = KarjoorColors.Navy,

    secondary = KarjoorColors.Secondary,
    onSecondary = KarjoorColors.OnSecondary,
    secondaryContainer = KarjoorColors.SecondaryContainer,
    onSecondaryContainer = KarjoorColors.Navy,

    tertiary = KarjoorColors.Navy,
    onTertiary = KarjoorColors.Surface,
    tertiaryContainer = KarjoorColors.SurfaceVariant,
    onTertiaryContainer = KarjoorColors.TextPrimary,

    error = KarjoorColors.Error,
    onError = KarjoorColors.OnPrimary,
    errorContainer = KarjoorColors.ErrorSoft,
    onErrorContainer = KarjoorColors.Error,

    background = KarjoorColors.Background,
    onBackground = KarjoorColors.TextPrimary,

    surface = KarjoorColors.Surface,
    onSurface = KarjoorColors.TextPrimary,
    surfaceVariant = KarjoorColors.SurfaceVariant,
    onSurfaceVariant = KarjoorColors.TextSecondary,

    surfaceContainerLowest = KarjoorColors.Surface,
    surfaceContainerLow = KarjoorColors.Surface,
    surfaceContainer = KarjoorColors.Background,
    surfaceContainerHigh = KarjoorColors.SurfaceVariant,
    surfaceContainerHighest = KarjoorColors.SurfaceVariant,

    inverseSurface = KarjoorColors.Navy,
    inverseOnSurface = KarjoorColors.Surface,

    outline = KarjoorColors.Outline,
    outlineVariant = KarjoorColors.Border,

    scrim = KarjoorColors.TextPrimary,
)

@Composable
fun KarvinTheme(
    @Suppress("UNUSED_PARAMETER") darkTheme: Boolean = false,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = KarjoorLightColors,
        typography = KarjoorTypography,
        shapes = KarjoorShapes,
        content = content,
    )
}

/** Preferred name for new call sites. Identical behaviour to [KarvinTheme]. */
@Composable
fun KarjoorTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = KarjoorLightColors,
        typography = KarjoorTypography,
        shapes = KarjoorShapes,
        content = content,
    )
}

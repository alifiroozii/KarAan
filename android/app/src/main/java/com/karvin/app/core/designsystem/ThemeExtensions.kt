package com.karvin.app.core.designsystem

import androidx.compose.material3.ColorScheme
import androidx.compose.ui.graphics.Color

/**
 * Domain accents that Material's [ColorScheme] has no slot for.
 *
 * These are intentionally theme-independent: KARJOOR ships the light theme only
 * in this release, so returning the brand token directly is correct and avoids a
 * light accent bleeding into a future dark scheme by accident.
 */
val ColorScheme.star: Color get() = KarjoorColors.Warning
val ColorScheme.online: Color get() = KarjoorColors.Success
val ColorScheme.provider: Color get() = KarjoorColors.Secondary


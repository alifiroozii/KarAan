package com.karvin.app.core.designsystem

import androidx.compose.ui.graphics.Color

/**
 * Legacy colour names retained as aliases onto the KARJOOR token set.
 *
 * New screens must use [KarjoorColors] directly. These exist only so the older
 * design-system components keep compiling against one source of truth.
 */
val KarvinLightPrimary: Color get() = KarjoorColors.Primary
val KarvinDarkPrimary: Color get() = Color(0xFF93B4FD)
val KarvinLightSecondary: Color get() = KarjoorColors.Secondary
val KarvinDarkSecondary: Color get() = Color(0xFF5EEAD4)
val KarvinLightTertiary: Color get() = KarjoorColors.Success
val KarvinDarkTertiary: Color get() = Color(0xFF4ADE80)
val KarvinLightStar: Color get() = KarjoorColors.Warning
val KarvinDarkStar: Color get() = Color(0xFFFBBF24)
val KarvinLightOnline: Color get() = KarjoorColors.Success
val KarvinDarkOnline: Color get() = Color(0xFF4ADE80)

/** Performer accent — the old "provider amber" is now the brand teal. */
val KarvinLightProvider: Color get() = KarjoorColors.Secondary
val KarvinDarkProvider: Color get() = Color(0xFF5EEAD4)


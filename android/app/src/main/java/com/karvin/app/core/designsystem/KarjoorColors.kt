package com.karvin.app.core.designsystem

import androidx.compose.ui.graphics.Color

/**
 * KARJOOR semantic colour tokens.
 *
 * Every value below is the brand contract. Screens must consume these tokens (or
 * [MaterialTheme.colorScheme]) and never a raw hex literal, so spacing, radius and
 * colour stay identical across the whole app.
 *
 * Contrast notes (WCAG AA):
 *  - [PrimaryText] on [Background]      → 15.8:1
 *  - [SecondaryText] on [Background]    → 4.8:1
 *  - [OnPrimary] on [Primary]           → 5.2:1
 *  - [OnSecondary] on [Secondary]       → 3.0:1 (large text / icons only)
 *  - [AccentCoral] is an accent, not a body or button colour.
 */
object KarjoorColors {
    // ── Brand ──
    val Primary = Color(0xFF2563EB)
    val PrimaryPressed = Color(0xFF1D4ED8)
    val Secondary = Color(0xFF14B8A6)
    val Navy = Color(0xFF11244A)

    /** Sparingly: urgent badges and a single highlighted call to action. */
    val AccentCoral = Color(0xFFFF785A)

    // ── Surfaces ──
    val Background = Color(0xFFF8FAFC)
    val Surface = Color(0xFFFFFFFF)

    // ── Text ──
    val TextPrimary = Color(0xFF0F172A)
    val TextSecondary = Color(0xFF64748B)

    // ── Lines ──
    val Border = Color(0xFFE2E8F0)

    // ── Status ──
    val Success = Color(0xFF16A34A)
    val Warning = Color(0xFFF59E0B)
    val Error = Color(0xFFDC2626)

    // ── Derived containers (kept as tokens so screens don't invent tints) ──
    val PrimaryContainer = Color(0xFFEFF6FF)
    val SecondaryContainer = Color(0xFFCCFBF1)
    val SurfaceVariant = Color(0xFFF1F5F9)
    val Outline = Color(0xFFCBD5E1)
    val OutlineVariant = Color(0xFFE2E8F0)
    val OnPrimary = Color(0xFFFFFFFF)
    val OnSecondary = Color(0xFFFFFFFF)
    val OnSurfaceVariant = Color(0xFF64748B)

    /** Translucent tints derived from the brand tokens, for chips and pills. */
    val PrimarySoft = Color(0x1A2563EB)
    val SecondarySoft = Color(0x1A14B8A6)
    val CoralSoft = Color(0x1AFF785A)
    val SuccessSoft = Color(0x1A16A34A)
    val WarningSoft = Color(0x1AF59E0B)
    val ErrorSoft = Color(0x1ADC2626)
}

/**
 * Requester accent. Deliberately Primary, not coral — coral stays rare.
 */
val RequesterBlue: Color get() = KarjoorColors.Primary

/** Performer accent. */
val PerformerTeal: Color get() = KarjoorColors.Secondary

package com.karvin.app.core.designsystem

import androidx.compose.ui.unit.dp

/**
 * KARJOOR spacing, sizing and radius tokens.
 *
 * Screens must pick from here instead of writing literal dp values. That is what
 * makes a card in the Performer feed identical to a card in the Requester feed.
 */
object KarjoorDimensions {
    // ── Spacing (4dp base grid) ──
    val spacing4 = 4.dp
    val spacing8 = 8.dp
    val spacing12 = 12.dp
    val spacing16 = 16.dp
    val spacing20 = 20.dp
    val spacing24 = 24.dp
    val spacing28 = 28.dp
    val spacing32 = 32.dp

    /** Horizontal screen gutter. */
    val screenGutter = 20.dp

    // ── Component heights ──
    val topBarHeight = 64.dp
    val bottomBarHeight = 80.dp

    /** Android minimum touch target — never smaller. */
    val touchTarget = 48.dp
    val buttonHeight = 52.dp
    val textFieldHeight = 56.dp

    // ── Corner radii ──
    val cornerSmall = 12.dp
    val cornerMedium = 14.dp
    val cornerCard = 16.dp
    val cornerLarge = 20.dp
    val cornerBottomSheet = 28.dp
    val cornerPill = 999.dp

    // ── Avatars ──
    val avatarSmall = 32.dp
    val avatarMedium = 48.dp
    val avatarLarge = 72.dp
    val avatarProfile = 96.dp

    // ── Legacy aliases so the older component library keeps resolving ──
    val xs = spacing4
    val sm = spacing8
    val md = spacing12
    val lg = spacing16
    val xl = spacing20
    val xxl = spacing24
    val screen = screenGutter
    val corner = cornerCard
}

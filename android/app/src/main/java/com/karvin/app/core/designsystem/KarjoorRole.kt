package com.karvin.app.core.designsystem

import com.karvin.app.domain.model.UserRole

/**
 * KARJOOR role model at the presentation boundary.
 *
 * The wire and database keep the internal identifiers `WORKER` / `EMPLOYER` so
 * the existing backend contract, permissions and Drizzle schema stay valid. Only
 * the user-visible labels change, and they live here — never scattered through
 * screens as string literals.
 */
enum class KarjoorRole {
    PERFORMER,
    REQUESTER,
    ;

    /** Persian display name shown in the UI. */
    val displayName: String
        get() = when (this) {
            PERFORMER -> "انجام‌دهنده"
            REQUESTER -> "درخواست‌دهنده"
        }

    /** Latin name for bilingual moments such as splash and role badges. */
    val latinName: String
        get() = when (this) {
            PERFORMER -> "Performer"
            REQUESTER -> "Requester"
        }

    /** Accent colour for this role's surfaces. Deliberately two, not many. */
    val accent: androidx.compose.ui.graphics.Color
        get() = when (this) {
            PERFORMER -> KarjoorColors.Secondary
            REQUESTER -> KarjoorColors.Primary
        }

    val softAccent: androidx.compose.ui.graphics.Color
        get() = when (this) {
            PERFORMER -> KarjoorColors.SecondarySoft
            REQUESTER -> KarjoorColors.PrimarySoft
        }
}

/**
 * Maps the app's domain role onto the KARJOOR presentation role.
 *
 * The mapping is 1:1 today. Keeping it explicit means a future role (e.g. an
 * admin console) has an obvious place to be handled instead of silently falling
 * into one of the two marketplace dashboards.
 */
fun UserRole.toKarjoorRole(): KarjoorRole = when (this) {
    UserRole.PROVIDER -> KarjoorRole.PERFORMER
    UserRole.REQUESTER -> KarjoorRole.REQUESTER
}

/** Reverse mapping back to the domain role the API and DB expect. */
fun KarjoorRole.toDomainRole(): UserRole = when (this) {
    KarjoorRole.PERFORMER -> UserRole.PROVIDER
    KarjoorRole.REQUESTER -> UserRole.REQUESTER
}

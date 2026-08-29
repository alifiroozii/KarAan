package com.karvin.app.domain.model

import com.karvin.app.data.FakeData

/**
 * A specialist/provider shown on the requester's map.
 * This is a demo model independent of the existing [User] model.
 */
data class NearbyProvider(
    val id: String,
    val name: String,
    val primarySkill: String,
    val skills: List<String>,
    val point: GeoPoint,
    val rating: Double,
    val reviewCount: Int,
    val completedJobs: Int,
    val isAvailable: Boolean,
    val isVerified: Boolean,
    val basePrice: Long,
    val shortBio: String,
    val responseTime: String,
    val portfolioItems: List<String>,
    val services: List<String>,
)

/**
 * A service request shown on the provider's map.
 * This is a demo model independent of the existing [Job] model.
 */
data class NearbyServiceRequest(
    val id: String,
    val title: String,
    val category: Category,
    val description: String,
    val budget: Long,
    val budgetLabel: String,
    val point: GeoPoint,
    val createdAt: String,
    val isUrgent: Boolean,
    val requesterRating: Double,
    val scheduledTime: String,
    val approximateAddress: String,
    val requesterName: String,
)

/** Filter state for the requester map. */
data class RequesterMapFilter(
    val query: String = "",
    val categoryId: String? = null,
    val distanceFilter: DistanceFilter = DistanceFilter.UNDER_TEN,
    val minimumRating: Double? = null,
    val availableOnly: Boolean = false,
    val verifiedOnly: Boolean = false,
)

/** Filter state for the provider map. */
data class ProviderMapFilter(
    val query: String = "",
    val categoryId: String? = null,
    val distanceFilter: DistanceFilter = DistanceFilter.UNDER_TEN,
    val urgentOnly: Boolean = false,
)

/** App mode for the map-first demo. */
enum class AppMode { REQUESTER, PROVIDER }

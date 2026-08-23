package com.karvin.app.domain.model

data class LocationPoint(
    val latitude: Double,
    val longitude: Double,
    val addressName: String = "",
    val city: String = "تهران"
) {
    companion object {
        // Tehran center default coordinate
        val DEFAULT_TEHRAN = LocationPoint(
            latitude = 35.7219,
            longitude = 51.3347,
            addressName = "تهران، میدان آزادی",
            city = "تهران"
        )
    }
}

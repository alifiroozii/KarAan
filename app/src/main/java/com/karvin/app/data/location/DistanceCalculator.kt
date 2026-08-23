package com.karvin.app.data.location

import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.utils.PersianDateFormatter
import java.text.DecimalFormat
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

object DistanceCalculator {

    private const val EARTH_RADIUS_METERS = 6371000.0

    /**
     * Calculates distance between two coordinates using the Haversine formula.
     * Returns distance in meters.
     */
    fun calculateDistanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Int {
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)

        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2) * sin(dLon / 2)

        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return (EARTH_RADIUS_METERS * c).toInt()
    }

    fun calculateDistanceMeters(point1: LocationPoint, point2: LocationPoint): Int {
        return calculateDistanceMeters(
            point1.latitude,
            point1.longitude,
            point2.latitude,
            point2.longitude
        )
    }

    /**
     * Formats distance in Persian (e.g. "۳۵۰ متر فاصله" or "۱.۴ کیلومتر فاصله")
     */
    fun formatDistanceFa(distanceMeters: Int): String {
        return if (distanceMeters < 1000) {
            val rounded = (distanceMeters / 50) * 50
            val display = if (rounded < 100) 100 else rounded
            "${PersianDateFormatter.toPersianDigits(display)} متر فاصله"
        } else {
            val km = distanceMeters / 1000.0
            val df = DecimalFormat("#.#")
            val formatted = df.format(km)
            "${PersianDateFormatter.toPersianDigits(formatted)} کیلومتر فاصله"
        }
    }
}

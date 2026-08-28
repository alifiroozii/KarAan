package com.karvin.app.domain.model

import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

object DistanceCalculator {
    private const val EarthRadiusKm = 6371.0

    fun distanceInKm(from: GeoPoint, to: GeoPoint): Double {
        val dLat = Math.toRadians(to.latitude - from.latitude)
        val dLon = Math.toRadians(to.longitude - from.longitude)
        val lat1 = Math.toRadians(from.latitude)
        val lat2 = Math.toRadians(to.latitude)
        val a = sin(dLat / 2) * sin(dLat / 2) +
            cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2)
        return EarthRadiusKm * 2 * atan2(sqrt(a), sqrt(1 - a))
    }

    fun matches(distanceKm: Double, filter: DistanceFilter): Boolean =
        filter.maxKm == null || distanceKm <= filter.maxKm

    fun format(distanceKm: Double): String {
        val value = if (distanceKm < 10) {
            String.format(java.util.Locale.US, "%.1f", distanceKm)
        } else {
            distanceKm.toInt().toString()
        }
        return "${value.toPersianDigits()} کیلومتر"
    }
}

fun String.toPersianDigits(): String = buildString(length) {
    for (char in this@toPersianDigits) {
        append(
            when (char) {
                '0' -> '۰'
                '1' -> '۱'
                '2' -> '۲'
                '3' -> '۳'
                '4' -> '۴'
                '5' -> '۵'
                '6' -> '۶'
                '7' -> '۷'
                '8' -> '۸'
                '9' -> '۹'
                '.' -> '٫'
                else -> char
            },
        )
    }
}

fun Number.toPersianDigits(): String = toString().toPersianDigits()

fun Long.toRialString(): String =
    "%,d ریال".format(java.util.Locale.US, this).toPersianDigits()

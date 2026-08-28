package com.karvin.app

import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.GeoPoint
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DistanceCalculatorTest {
    @Test
    fun identicalPointsHaveZeroDistance() {
        val point = GeoPoint(35.7219, 51.3347)
        assertEquals(0.0, DistanceCalculator.distanceInKm(point, point), 0.0001)
    }

    @Test
    fun distanceFilterUsesInclusiveBoundary() {
        assertTrue(DistanceCalculator.matches(5.0, DistanceFilter.UNDER_FIVE))
        assertTrue(!DistanceCalculator.matches(5.01, DistanceFilter.UNDER_FIVE))
        assertTrue(DistanceCalculator.matches(100.0, DistanceFilter.ALL))
    }

    @Test
    fun formatUsesPersianDigits() {
        assertTrue(DistanceCalculator.format(2.3).contains("۲"))
        assertTrue(DistanceCalculator.format(2.3).contains("کیلومتر"))
    }
}

package com.karvin.app

import com.karvin.app.data.FakeNearbyData
import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.GeoPoint
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs

class MapDemoBehaviorTest {
    private val center = GeoPoint(35.7219, 51.3347)

    @Test
    fun generatedResultsAreDeterministicForTheSameCenter() {
        assertEquals(FakeNearbyData.generateProviders(center), FakeNearbyData.generateProviders(center))
        assertEquals(FakeNearbyData.generateRequests(center), FakeNearbyData.generateRequests(center))
    }

    @Test
    fun searchingAnotherAreaMovesResultsWithoutChangingTheirShape() {
        val moved = GeoPoint(center.latitude + 0.2, center.longitude - 0.15)
        val original = FakeNearbyData.generateProviders(center)
        val relocated = FakeNearbyData.generateProviders(moved)

        assertEquals(original.size, relocated.size)
        assertNotEquals(original.first().point, relocated.first().point)
        assertTrue(abs(
            (original.first().point.latitude - center.latitude) -
                (relocated.first().point.latitude - moved.latitude),
        ) < 0.000000001)
        assertTrue(abs(
            (original.first().point.longitude - center.longitude) -
                (relocated.first().point.longitude - moved.longitude),
        ) < 0.000000001)
    }

    @Test
    fun distanceFilterIncludesBoundaryAndExcludesOutside() {
        assertTrue(DistanceCalculator.matches(5.0, DistanceFilter.UNDER_FIVE))
        assertTrue(!DistanceCalculator.matches(5.0001, DistanceFilter.UNDER_FIVE))
        assertTrue(DistanceCalculator.matches(500.0, DistanceFilter.ALL))
    }

    @Test
    fun generatedProviderCategoriesMapBackToTheirSourceIds() {
        FakeNearbyData.generateProviders(center).forEach { provider ->
            assertTrue(FakeNearbyData.categoryIdForProvider(provider) != null)
        }
    }
}

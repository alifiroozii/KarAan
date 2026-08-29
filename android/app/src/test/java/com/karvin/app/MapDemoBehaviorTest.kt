package com.karvin.app

import com.karvin.app.data.FakeNearbyData
import com.karvin.app.domain.model.DistanceCalculator
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.GeoPoint
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MapDemoBehaviorTest {
    private val center = GeoPoint(35.7219, 51.3347)

    @Test
    fun nearbyDataIsStableAndRelocatable() {
        val providers = FakeNearbyData.generateProviders(center)
        assertEquals(providers, FakeNearbyData.generateProviders(center))
        val moved = GeoPoint(center.latitude + .2, center.longitude - .15)
        val relocated = FakeNearbyData.generateProviders(moved)
        assertEquals(providers.size, relocated.size)
        assertNotEquals(providers.first().point, relocated.first().point)
        assertEquals(providers.first().point.latitude - center.latitude, relocated.first().point.latitude - moved.latitude, 1e-9)
    }

    @Test
    fun distanceFilterHasInclusiveBoundaryAndAllRange() {
        assertTrue(DistanceCalculator.matches(5.0, DistanceFilter.UNDER_FIVE))
        assertTrue(!DistanceCalculator.matches(5.0001, DistanceFilter.UNDER_FIVE))
        assertTrue(DistanceCalculator.matches(500.0, DistanceFilter.ALL))
    }
}

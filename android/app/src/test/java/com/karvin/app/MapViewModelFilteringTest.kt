package com.karvin.app

import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.ProviderMapFilter
import com.karvin.app.domain.model.RequesterMapFilter
import com.karvin.app.feature.home.ProviderHomeViewModel
import com.karvin.app.feature.map.RequesterMapViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MapViewModelFilteringTest {
    @Test
    fun requesterSearchAroundReappliesExistingFilter() {
        val viewModel = RequesterMapViewModel()
        viewModel.updateFilter(RequesterMapFilter(availableOnly = true))
        val center = GeoPoint(35.8, 51.4)
        viewModel.searchAround(center)

        assertTrue(viewModel.state.value.filteredProviders.all { it.isAvailable })
    }

    @Test
    fun providerSearchAroundReappliesExistingFilter() {
        val viewModel = ProviderHomeViewModel()
        viewModel.updateFilter(ProviderMapFilter(urgentOnly = true))
        viewModel.searchAround(GeoPoint(35.8, 51.4))

        assertTrue(viewModel.mapState.value.filteredRequests.all { it.isUrgent })
    }
}

package com.karvin.app

import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.ProviderMapFilter
import com.karvin.app.domain.model.RequesterMapFilter
import com.karvin.app.feature.home.ProviderHomeViewModel
import com.karvin.app.feature.map.RequesterMapViewModel
import org.junit.Assert.assertTrue
import org.junit.Test

class MapViewModelFilteringTest {
    @Test
    fun requesterSearchAroundReappliesExistingFilter() {
        val viewModel = RequesterMapViewModel()
        viewModel.updateFilter(RequesterMapFilter(availableOnly = true))
        val center = GeoPoint(35.8, 51.4)
        viewModel.searchAround(center)

        val state = viewModel.state.value
        assertTrue(state.filteredProviders.all { it.isAvailable })
    }

    @Test
    fun providerSearchAroundReappliesExistingFilter() {
        val viewModel = ProviderHomeViewModel()
        viewModel.updateFilter(ProviderMapFilter(urgentOnly = true))
        viewModel.searchAround(GeoPoint(35.8, 51.4))

        val state = viewModel.mapState.value
        assertTrue(state.filteredRequests.isNotEmpty())
        assertTrue(state.filteredRequests.all { it.isUrgent })
    }
}

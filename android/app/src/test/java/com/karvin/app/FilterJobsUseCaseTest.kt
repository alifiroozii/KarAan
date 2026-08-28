package com.karvin.app

import com.karvin.app.data.FakeData
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.JobFilter
import com.karvin.app.domain.usecase.FilterJobsUseCase
import org.junit.Assert.assertTrue
import org.junit.Test

class FilterJobsUseCaseTest {
    private val useCase = FilterJobsUseCase()

    @Test
    fun queryMatchesTitleAndCategory() {
        val result = useCase(FakeData.jobs, JobFilter(query = "ماساژ درمانی ورزشی"), FakeData.center)
        assertTrue(result.isNotEmpty())
        assertTrue(result.all { it.title.contains("ماساژ درمانی ورزشی") })
    }

    @Test
    fun urgentFilterReturnsOnlyUrgentJobs() {
        val result = useCase(FakeData.jobs, JobFilter(urgentOnly = true), FakeData.center)
        assertTrue(result.isNotEmpty())
        assertTrue(result.all { it.isUrgent })
    }

    @Test
    fun distanceFilterOrdersNearbyJobsFirst() {
        val result = useCase(FakeData.jobs, JobFilter(distance = DistanceFilter.UNDER_ONE), FakeData.center)
        assertTrue(result.zipWithNext().all { (first, second) -> first.point != second.point })
    }

    @Test
    fun amountAndRatingFiltersAreApplied() {
        val result = useCase(FakeData.jobs, JobFilter(minAmount = 1_000_000, minimumRating = 4.8), FakeData.center)
        assertTrue(result.all { it.amount >= 1_000_000 && it.employer.rating >= 4.8 })
    }
}

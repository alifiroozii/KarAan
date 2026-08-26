package com.karvin.app

import com.karvin.app.data.repository.FakeJobRepository
import com.karvin.app.data.repository.FakeRepositoryStore
import com.karvin.app.domain.model.JobFilter
import com.karvin.app.feature.jobs.JobsViewModel
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class JobsViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun viewModelLoadsJobsAndAppliesQuery() = runTest {
        val viewModel = JobsViewModel(FakeJobRepository(FakeRepositoryStore()))
        assertFalse(viewModel.state.value.loading)
        assertTrue(viewModel.state.value.jobs.isNotEmpty())

        viewModel.updateFilter(JobFilter(query = "کولر"))
        assertTrue(viewModel.state.value.jobs.all { it.title.contains("کولر") })
    }
}

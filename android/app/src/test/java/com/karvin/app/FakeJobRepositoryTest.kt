package com.karvin.app

import com.karvin.app.data.FakeData
import com.karvin.app.data.repository.FakeJobRepository
import com.karvin.app.data.repository.FakeRepositoryStore
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.JobStatus
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class FakeJobRepositoryTest {
    private val repository = FakeJobRepository(FakeRepositoryStore())

    @Test
    fun applyingToOpenJobAddsApplicationAndMovesJobToApplied() = runTest {
        val job = FakeData.jobs.first { job ->
            job.status == JobStatus.OPEN && FakeData.applications.none { it.jobId == job.id }
        }
        val result = repository.applyToJob(job.id, "آماده همکاری هستم")
        assertTrue(result is AppResult.Success)
        val updated = repository.observeJob(job.id).firstSuccess()
        assertEquals(JobStatus.APPLIED, updated.status)
    }

    @Test
    fun acceptingApplicationUpdatesApplicationAndJob() = runTest {
        val application = FakeData.applications.first { it.status == com.karvin.app.domain.model.ApplicationStatus.PENDING }
        val accepted = repository.acceptApplication(application.id).firstSuccess()
        assertEquals(com.karvin.app.domain.model.ApplicationStatus.ACCEPTED, accepted.status)
        assertEquals(JobStatus.ACCEPTED, repository.observeJob(application.jobId).firstSuccess().status)
    }

    @Test
    fun savingJobCanBeToggled() = runTest {
        val job = FakeData.jobs.first()
        assertEquals(true, repository.toggleSaved(job.id).firstSuccess())
        assertTrue(repository.observeJob(job.id).firstSuccess().isSaved)
        assertEquals(false, repository.toggleSaved(job.id).firstSuccess())
        assertTrue(!repository.observeJob(job.id).firstSuccess().isSaved)
    }

    @Test
    fun workflowStatusCanAdvance() = runTest {
        val job = FakeData.jobs.first()
        val result = repository.updateJobStatus(job.id, JobStatus.IN_PROGRESS)
        assertEquals(JobStatus.IN_PROGRESS, result.firstSuccess().status)
    }
}

private suspend fun <T> kotlinx.coroutines.flow.Flow<AppResult<T>>.firstSuccess(): T {
    return when (val result = first()) {
        is AppResult.Success -> result.data
        is AppResult.Error -> error(result.message)
        AppResult.Loading -> error("unexpected loading")
    }
}

private suspend fun <T> AppResult<T>.firstSuccess(): T = when (this) {
    is AppResult.Success -> data
    is AppResult.Error -> error(message)
    AppResult.Loading -> error("unexpected loading")
}

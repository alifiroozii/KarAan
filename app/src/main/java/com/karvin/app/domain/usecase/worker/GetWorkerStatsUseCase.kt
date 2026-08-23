package com.karvin.app.domain.usecase.worker

import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.WorkerRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

data class WorkerStats(
    val nearbyJobsCount: Int = 0,
    val applicationsCount: Int = 0,
    val activeShiftsCount: Int = 0,
    val monthlyEarningsToman: Long = 0,
    val performanceRating: Float = 5.0f,
    val completedJobsCount: Int = 0
)

class GetWorkerStatsUseCase @Inject constructor(
    private val workerRepository: WorkerRepository
) {
    fun getProfile(userId: String): Flow<WorkerProfile?> {
        return workerRepository.getWorkerProfile(userId)
    }

    suspend fun toggleAvailability(userId: String, isAvailable: Boolean) {
        workerRepository.toggleAvailability(userId, isAvailable)
    }
}

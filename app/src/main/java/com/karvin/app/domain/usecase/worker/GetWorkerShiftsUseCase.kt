package com.karvin.app.domain.usecase.worker

import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetWorkerShiftsUseCase @Inject constructor(
    private val workerRepository: WorkerRepository
) {
    operator fun invoke(workerId: String): Flow<List<Shift>> {
        return workerRepository.getWorkerShifts(workerId)
    }

    suspend fun updateStatus(shiftId: String, status: ShiftStatus): Resource<Shift> {
        return workerRepository.updateShiftStatus(shiftId, status)
    }
}

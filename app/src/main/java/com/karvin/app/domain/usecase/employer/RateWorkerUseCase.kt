package com.karvin.app.domain.usecase.employer

import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.model.Rating
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.repository.EmployerRepository
import com.karvin.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class RateWorkerUseCase @Inject constructor(
    private val employerRepository: EmployerRepository
) {
    suspend operator fun invoke(rating: Rating): Resource<Rating> {
        if (rating.score < 1 || rating.score > 5) {
            return Resource.Error("امتیاز باید بین ۱ تا ۵ ستاره باشد")
        }
        return employerRepository.rateWorker(rating)
    }
}

class GetEmployerStatsUseCase @Inject constructor(
    private val employerRepository: EmployerRepository
) {
    fun getProfile(userId: String): Flow<EmployerProfile?> {
        return employerRepository.getEmployerProfile(userId)
    }

    fun getEmployerShifts(employerId: String): Flow<List<Shift>> {
        return employerRepository.getEmployerShifts(employerId)
    }
}

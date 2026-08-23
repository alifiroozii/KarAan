package com.karvin.app.domain.usecase.auth

import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.AuthRepository
import com.karvin.app.utils.Resource
import javax.inject.Inject

class RegisterWorkerUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(profile: WorkerProfile): Resource<User> {
        if (profile.fullName.isBlank()) {
            return Resource.Error("نام و نام خانوادگی الزامی است")
        }
        if (profile.nationalId.length != 10) {
            return Resource.Error("کد ملی باید ۱۰ رقم باشد")
        }
        if (profile.city.isBlank()) {
            return Resource.Error("انتخاب شهر الزامی است")
        }
        return authRepository.registerWorker(profile)
    }
}

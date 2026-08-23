package com.karvin.app.domain.usecase.auth

import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.model.User
import com.karvin.app.domain.repository.AuthRepository
import com.karvin.app.utils.Resource
import javax.inject.Inject

class RegisterEmployerUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(profile: EmployerProfile): Resource<User> {
        if (profile.fullName.isBlank()) {
            return Resource.Error("نام و نام خانوادگی الزامی است")
        }
        if (profile.businessName.isBlank()) {
            return Resource.Error("نام کسب‌وکار یا کارگاه الزامی است")
        }
        if (profile.city.isBlank()) {
            return Resource.Error("انتخاب شهر الزامی است")
        }
        return authRepository.registerEmployer(profile)
    }
}

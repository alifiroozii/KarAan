package com.karvin.app.presentation.auth.employer_register

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.model.User
import com.karvin.app.domain.usecase.auth.RegisterEmployerUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class EmployerRegisterState(
    val fullName: String = "",
    val businessName: String = "",
    val businessCategory: String = "پیمانکاری و ساخت‌وساز",
    val city: String = "تهران",
    val address: String = "سعادت‌آباد، میدان کاج",
    val contactInfo: String = "02122334455",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val registrationSuccessUser: User? = null
)

@HiltViewModel
class EmployerRegisterViewModel @Inject constructor(
    private val registerEmployerUseCase: RegisterEmployerUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(EmployerRegisterState())
    val state: StateFlow<EmployerRegisterState> = _state.asStateFlow()

    fun onFullNameChange(value: String) { _state.value = _state.value.copy(fullName = value, errorMessage = null) }
    fun onBusinessNameChange(value: String) { _state.value = _state.value.copy(businessName = value, errorMessage = null) }
    fun onBusinessCategoryChange(value: String) { _state.value = _state.value.copy(businessCategory = value) }
    fun onCityChange(value: String) { _state.value = _state.value.copy(city = value, errorMessage = null) }
    fun onAddressChange(value: String) { _state.value = _state.value.copy(address = value) }
    fun onContactInfoChange(value: String) { _state.value = _state.value.copy(contactInfo = value) }

    fun registerEmployer() {
        val s = _state.value
        if (s.fullName.isBlank()) {
            _state.value = _state.value.copy(errorMessage = "نام و نام خانوادگی مسئول الزامی است")
            return
        }
        if (s.businessName.isBlank()) {
            _state.value = _state.value.copy(errorMessage = "نام کسب‌وکار یا شرکت الزامی است")
            return
        }
        if (s.city.isBlank()) {
            _state.value = _state.value.copy(errorMessage = "انتخاب شهر الزامی است")
            return
        }

        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, errorMessage = null)
            val profile = EmployerProfile(
                userId = "employer_${UUID.randomUUID().toString().take(8)}",
                fullName = s.fullName,
                businessName = s.businessName,
                businessCategory = s.businessCategory,
                city = s.city,
                address = s.address,
                contactInfo = s.contactInfo,
                avatarUrl = null,
                isVerified = true,
                rating = 5.0f,
                postedJobsCount = 0,
                activeShiftsCount = 0
            )

            when (val result = registerEmployerUseCase(profile)) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(isLoading = false, registrationSuccessUser = result.data)
                }
                is Resource.Error -> {
                    _state.value = _state.value.copy(isLoading = false, errorMessage = result.message)
                }
                else -> Unit
            }
        }
    }
}

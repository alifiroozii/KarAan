package com.karvin.app.presentation.employer.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.repository.EmployerRepository
import com.karvin.app.domain.usecase.auth.LogoutUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class EmployerProfileUiState(
    val profile: EmployerProfile? = null,
    val isLoggedOut: Boolean = false,
    val isLoading: Boolean = false
)

@HiltViewModel
class EmployerProfileViewModel @Inject constructor(
    private val employerRepository: EmployerRepository,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(EmployerProfileUiState())
    val uiState: StateFlow<EmployerProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    private fun loadProfile() {
        viewModelScope.launch {
            employerRepository.getEmployerProfile("emp_101").collect { p ->
                _uiState.value = _uiState.value.copy(profile = p)
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            logoutUseCase()
            _uiState.value = _uiState.value.copy(isLoading = false, isLoggedOut = true)
        }
    }
}

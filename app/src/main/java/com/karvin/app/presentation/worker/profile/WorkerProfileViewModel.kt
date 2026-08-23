package com.karvin.app.presentation.worker.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.domain.usecase.auth.LogoutUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WorkerProfileUiState(
    val profile: WorkerProfile? = null,
    val isLoggedOut: Boolean = false,
    val isLoading: Boolean = false
)

@HiltViewModel
class WorkerProfileViewModel @Inject constructor(
    private val workerRepository: WorkerRepository,
    private val logoutUseCase: LogoutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(WorkerProfileUiState())
    val uiState: StateFlow<WorkerProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    private fun loadProfile() {
        viewModelScope.launch {
            workerRepository.getWorkerProfile("worker_default").collect { p ->
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

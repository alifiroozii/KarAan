package com.karvin.app.presentation.employer.workers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.JobInvitation
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.InvitationRepository
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WorkerPublicProfileUiState(
    val worker: WorkerProfile? = null,
    val showInviteDialog: Boolean = false,
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class WorkerPublicProfileViewModel @Inject constructor(
    private val workerRepository: WorkerRepository,
    private val invitationRepository: InvitationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(WorkerPublicProfileUiState())
    val uiState: StateFlow<WorkerPublicProfileUiState> = _uiState.asStateFlow()

    fun loadWorkerProfile(workerId: String) {
        viewModelScope.launch {
            workerRepository.getWorkerProfile(workerId).collect { p ->
                val worker = p ?: com.karvin.app.data.repository.FakeDataGenerator.generate100Workers().find { it.userId == workerId }
                _uiState.value = _uiState.value.copy(worker = worker)
            }
        }
    }

    fun openInviteDialog() {
        _uiState.value = _uiState.value.copy(showInviteDialog = true)
    }

    fun closeInviteDialog() {
        _uiState.value = _uiState.value.copy(showInviteDialog = false)
    }

    fun sendInvitation(invitation: JobInvitation) {
        viewModelScope.launch {
            when (val res = invitationRepository.sendInvitation(invitation)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        showInviteDialog = false,
                        message = "دعوت‌نامه همکاری با موفقیت برای ${invitation.workerName} ارسال شد"
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(message = res.message)
                }
                else -> Unit
            }
        }
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(message = null)
    }
}

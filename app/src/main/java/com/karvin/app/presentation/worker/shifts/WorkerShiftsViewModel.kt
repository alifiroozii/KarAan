package com.karvin.app.presentation.worker.shifts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.domain.usecase.worker.GetWorkerShiftsUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WorkerShiftsUiState(
    val shifts: List<Shift> = emptyList(),
    val selectedFilter: ShiftStatus? = null,
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class WorkerShiftsViewModel @Inject constructor(
    private val getWorkerShiftsUseCase: GetWorkerShiftsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(WorkerShiftsUiState())
    val uiState: StateFlow<WorkerShiftsUiState> = _uiState.asStateFlow()

    init {
        loadShifts()
    }

    private fun loadShifts() {
        viewModelScope.launch {
            getWorkerShiftsUseCase("worker_default").collect { list ->
                _uiState.value = _uiState.value.copy(shifts = list)
            }
        }
    }

    fun setFilter(status: ShiftStatus?) {
        _uiState.value = _uiState.value.copy(selectedFilter = status)
    }

    fun toggleShiftStatus(shift: Shift) {
        val nextStatus = when (shift.status) {
            ShiftStatus.UPCOMING -> ShiftStatus.IN_PROGRESS
            ShiftStatus.IN_PROGRESS -> ShiftStatus.COMPLETED
            else -> return
        }

        viewModelScope.launch {
            when (val res = getWorkerShiftsUseCase.updateStatus(shift.id, nextStatus)) {
                is Resource.Success -> {
                    val msg = if (nextStatus == ShiftStatus.IN_PROGRESS) "ورود به شیفت با موفقیت ثبت شد" else "پایان شیفت ثبت شد. دستمزد محاسبه گردید."
                    _uiState.value = _uiState.value.copy(message = msg)
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

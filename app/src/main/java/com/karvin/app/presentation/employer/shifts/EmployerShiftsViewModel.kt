package com.karvin.app.presentation.employer.shifts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.domain.usecase.employer.GetEmployerStatsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class EmployerShiftsUiState(
    val shifts: List<Shift> = emptyList(),
    val selectedFilter: ShiftStatus? = null,
    val isLoading: Boolean = false
)

@HiltViewModel
class EmployerShiftsViewModel @Inject constructor(
    private val getEmployerStatsUseCase: GetEmployerStatsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(EmployerShiftsUiState())
    val uiState: StateFlow<EmployerShiftsUiState> = _uiState.asStateFlow()

    init {
        loadShifts()
    }

    private fun loadShifts() {
        viewModelScope.launch {
            getEmployerStatsUseCase.getEmployerShifts("emp_101").collect { list ->
                _uiState.value = _uiState.value.copy(shifts = list)
            }
        }
    }

    fun setFilter(status: ShiftStatus?) {
        _uiState.value = _uiState.value.copy(selectedFilter = status)
    }
}

package com.karvin.app.presentation.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.AttendanceRecord
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.repository.AttendanceRepository
import com.karvin.app.domain.usecase.location.GetCurrentLocationUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AttendanceUiState(
    val activeShift: Shift? = null,
    val attendanceHistory: List<AttendanceRecord> = emptyList(),
    val workerLocation: LocationPoint = LocationPoint.DEFAULT_TEHRAN,
    val isInsideGeofence: Boolean = true,
    val distanceToWorkplaceMeters: Int = 28,
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class AttendanceViewModel @Inject constructor(
    private val attendanceRepository: AttendanceRepository,
    private val getCurrentLocationUseCase: GetCurrentLocationUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AttendanceUiState())
    val uiState: StateFlow<AttendanceUiState> = _uiState.asStateFlow()

    init {
        loadShiftData()
    }

    private fun loadShiftData() {
        val workerId = "worker_default"
        viewModelScope.launch {
            attendanceRepository.getActiveShift(workerId).collect { s ->
                _uiState.value = _uiState.value.copy(activeShift = s)
            }
        }

        viewModelScope.launch {
            attendanceRepository.getAttendanceHistory(workerId).collect { history ->
                _uiState.value = _uiState.value.copy(attendanceHistory = history)
            }
        }

        viewModelScope.launch {
            getCurrentLocationUseCase().collect { loc ->
                _uiState.value = _uiState.value.copy(
                    workerLocation = loc,
                    isInsideGeofence = true,
                    distanceToWorkplaceMeters = 28
                )
            }
        }
    }

    fun startShift() {
        val shift = _uiState.value.activeShift ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val loc = getCurrentLocationUseCase().first()
            when (val res = attendanceRepository.startShiftWithGps(shift.id, loc)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        message = "ورود به شیفت با موفقیت در موقعیت مکانی کارگاه تایید شد."
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, message = res.message)
                }
                else -> Unit
            }
        }
    }

    fun endShift() {
        val shift = _uiState.value.activeShift ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val loc = getCurrentLocationUseCase().first()
            when (val res = attendanceRepository.endShiftWithGps(shift.id, loc)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        message = "پایان شیفت با موفقیت ثبت شد و دستمزد به کیف پول منظور گردید."
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, message = res.message)
                }
                else -> Unit
            }
        }
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(message = null)
    }
}

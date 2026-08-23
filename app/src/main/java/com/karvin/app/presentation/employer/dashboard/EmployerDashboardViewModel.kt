package com.karvin.app.presentation.employer.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.EmployerProfile
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.Shift
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.EmployerRepository
import com.karvin.app.domain.repository.LocationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

data class EmployerDashboardUiState(
    val profile: EmployerProfile? = null,
    val postedJobsCount: Int = 0,
    val receivedApplicantsCount: Int = 0,
    val approvedWorkersCount: Int = 0,
    val activeShiftsCount: Int = 0,
    val recentJobs: List<Job> = emptyList(),
    val nearbyAvailableWorkers: List<WorkerProfile> = emptyList(),
    val recentApplications: List<JobApplication> = emptyList(),
    val isLoading: Boolean = false
)

@HiltViewModel
class EmployerDashboardViewModel @Inject constructor(
    private val employerRepository: EmployerRepository,
    private val locationRepository: LocationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(EmployerDashboardUiState())
    val uiState: StateFlow<EmployerDashboardUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        val employerId = "emp_101"
        viewModelScope.launch {
            combine(
                employerRepository.getEmployerProfile(employerId),
                employerRepository.getEmployerJobs(employerId),
                employerRepository.getJobApplicants(employerId),
                employerRepository.getEmployerShifts(employerId),
                locationRepository.getNearbyWorkersOnMap(LocationPoint.DEFAULT_TEHRAN, radiusKm = 15.0)
            ) { profile, jobs, applicants, shifts, nearbyWorkers ->
                EmployerDashboardUiState(
                    profile = profile,
                    postedJobsCount = jobs.size,
                    receivedApplicantsCount = applicants.size,
                    approvedWorkersCount = applicants.count { it.status == ApplicationStatus.ACCEPTED },
                    activeShiftsCount = shifts.count { it.status == com.karvin.app.domain.model.ShiftStatus.UPCOMING || it.status == com.karvin.app.domain.model.ShiftStatus.IN_PROGRESS },
                    recentJobs = jobs,
                    nearbyAvailableWorkers = nearbyWorkers.take(4),
                    recentApplications = applicants.take(4),
                    isLoading = false
                )
            }.collect { state ->
                _uiState.value = state
            }
        }
    }
}

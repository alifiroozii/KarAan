package com.karvin.app.presentation.worker.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.usecase.matching.GetRecommendedJobsUseCase
import com.karvin.app.domain.usecase.worker.ApplyForJobUseCase
import com.karvin.app.domain.usecase.worker.GetNearbyJobsUseCase
import com.karvin.app.domain.usecase.worker.GetWorkerApplicationsUseCase
import com.karvin.app.domain.usecase.worker.GetWorkerShiftsUseCase
import com.karvin.app.domain.usecase.worker.GetWorkerStatsUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WorkerHomeUiState(
    val workerProfile: WorkerProfile? = null,
    val nearbyJobsCount: Int = 0,
    val applicationsCount: Int = 0,
    val activeShiftsCount: Int = 0,
    val monthlyEarningsToman: Long = 0,
    val performanceRating: Float = 5.0f,
    val recommendedJobs: List<Job> = emptyList(),
    val urgentJobs: List<Job> = emptyList(),
    val isAvailableForWork: Boolean = true,
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class WorkerHomeViewModel @Inject constructor(
    private val getWorkerStatsUseCase: GetWorkerStatsUseCase,
    private val getNearbyJobsUseCase: GetNearbyJobsUseCase,
    private val getRecommendedJobsUseCase: GetRecommendedJobsUseCase,
    private val getWorkerApplicationsUseCase: GetWorkerApplicationsUseCase,
    private val getWorkerShiftsUseCase: GetWorkerShiftsUseCase,
    private val applyForJobUseCase: ApplyForJobUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(WorkerHomeUiState())
    val uiState: StateFlow<WorkerHomeUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        val workerId = "worker_default"
        viewModelScope.launch {
            combine(
                getWorkerStatsUseCase.getProfile(workerId),
                getNearbyJobsUseCase(),
                getWorkerApplicationsUseCase(workerId),
                getWorkerShiftsUseCase(workerId)
            ) { profile, jobs, applications, shifts ->
                val mockProfile = profile ?: com.karvin.app.data.repository.FakeDataGenerator.generate100Workers().first()
                val sortedJobs = jobs.sortedByDescending { it.matchScorePercentage ?: 80 }

                WorkerHomeUiState(
                    workerProfile = mockProfile,
                    nearbyJobsCount = jobs.size,
                    applicationsCount = applications.size,
                    activeShiftsCount = shifts.count { it.status == com.karvin.app.domain.model.ShiftStatus.UPCOMING || it.status == com.karvin.app.domain.model.ShiftStatus.IN_PROGRESS },
                    monthlyEarningsToman = mockProfile.totalEarningsToman,
                    performanceRating = mockProfile.rating,
                    recommendedJobs = sortedJobs.take(4),
                    urgentJobs = jobs.filter { it.isUrgent },
                    isAvailableForWork = mockProfile.isAvailableForWork,
                    isLoading = false
                )
            }.collect { state ->
                _uiState.value = state
            }
        }
    }

    fun toggleAvailability(isAvailable: Boolean) {
        _uiState.value = _uiState.value.copy(isAvailableForWork = isAvailable)
        viewModelScope.launch {
            getWorkerStatsUseCase.toggleAvailability("worker_default", isAvailable)
        }
    }

    fun applyForJob(jobId: String) {
        viewModelScope.launch {
            when (val res = applyForJobUseCase("worker_default", jobId)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(message = "درخواست همکاری با موفقیت ثبت شد")
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

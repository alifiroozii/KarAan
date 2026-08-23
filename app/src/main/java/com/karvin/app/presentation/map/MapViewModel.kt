package com.karvin.app.presentation.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.domain.usecase.location.GetCurrentLocationUseCase
import com.karvin.app.domain.usecase.location.GetNearbyJobsOnMapUseCase
import com.karvin.app.domain.usecase.location.GetNearbyWorkersOnMapUseCase
import com.karvin.app.domain.usecase.location.ToggleAvailableNowUseCase
import com.karvin.app.domain.usecase.worker.ApplyForJobUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MapUiState(
    val userRole: UserRole = UserRole.WORKER,
    val currentLocation: LocationPoint = LocationPoint.DEFAULT_TEHRAN,
    val isAvailableNow: Boolean = true,
    val nearbyJobs: List<Job> = emptyList(),
    val nearbyWorkers: List<WorkerProfile> = emptyList(),
    val selectedJob: Job? = null,
    val selectedWorker: WorkerProfile? = null,
    val selectedCategoryId: String? = null,
    val categories: List<JobCategory> = emptyList(),
    val searchRadiusKm: Double = 15.0,
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class MapViewModel @Inject constructor(
    private val getCurrentLocationUseCase: GetCurrentLocationUseCase,
    private val getNearbyJobsOnMapUseCase: GetNearbyJobsOnMapUseCase,
    private val getNearbyWorkersOnMapUseCase: GetNearbyWorkersOnMapUseCase,
    private val toggleAvailableNowUseCase: ToggleAvailableNowUseCase,
    private val applyForJobUseCase: ApplyForJobUseCase,
    private val workerRepository: WorkerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MapUiState())
    val uiState: StateFlow<MapUiState> = _uiState.asStateFlow()

    init {
        loadLocationAndCategories()
    }

    private fun loadLocationAndCategories() {
        viewModelScope.launch {
            workerRepository.getAvailableCategories().collect { cats ->
                _uiState.value = _uiState.value.copy(categories = cats)
            }
        }

        viewModelScope.launch {
            getCurrentLocationUseCase().collect { loc ->
                _uiState.value = _uiState.value.copy(currentLocation = loc)
                refreshMapData()
            }
        }
    }

    fun setUserRole(role: UserRole) {
        _uiState.value = _uiState.value.copy(userRole = role)
        refreshMapData()
    }

    fun refreshMapData() {
        val state = _uiState.value
        if (state.userRole == UserRole.WORKER) {
            viewModelScope.launch {
                getNearbyJobsOnMapUseCase(state.currentLocation, state.searchRadiusKm).collect { jobs ->
                    _uiState.value = _uiState.value.copy(
                        nearbyJobs = jobs,
                        selectedJob = if (state.selectedJob != null) jobs.find { it.id == state.selectedJob.id } else jobs.firstOrNull()
                    )
                }
            }
        } else {
            viewModelScope.launch {
                getNearbyWorkersOnMapUseCase(state.currentLocation, state.selectedCategoryId, state.searchRadiusKm).collect { workers ->
                    _uiState.value = _uiState.value.copy(
                        nearbyWorkers = workers,
                        selectedWorker = if (state.selectedWorker != null) workers.find { it.userId == state.selectedWorker.userId } else workers.firstOrNull()
                    )
                }
            }
        }
    }

    fun toggleAvailableNow(isAvailable: Boolean) {
        _uiState.value = _uiState.value.copy(isAvailableNow = isAvailable)
        viewModelScope.launch {
            toggleAvailableNowUseCase("worker_default", isAvailable)
            val msg = if (isAvailable) "وضعیت شما روی نقشه: 🟢 آماده به کار" else "وضعیت شما روی نقشه: ⚪ غیرفعال"
            _uiState.value = _uiState.value.copy(message = msg)
        }
    }

    fun onCategoryFilterChange(categoryId: String?) {
        val newCat = if (_uiState.value.selectedCategoryId == categoryId) null else categoryId
        _uiState.value = _uiState.value.copy(selectedCategoryId = newCat)
        refreshMapData()
    }

    fun onJobSelected(job: Job) {
        _uiState.value = _uiState.value.copy(selectedJob = job)
    }

    fun onWorkerSelected(worker: WorkerProfile) {
        _uiState.value = _uiState.value.copy(selectedWorker = worker)
    }

    fun applyForJob(jobId: String) {
        viewModelScope.launch {
            when (val res = applyForJobUseCase("worker_default", jobId)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(message = "درخواست همکاری با موفقیت برای کارفرما ارسال شد")
                    refreshMapData()
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(message = res.message)
                }
                else -> Unit
            }
        }
    }

    fun inviteWorker(worker: WorkerProfile) {
        _uiState.value = _uiState.value.copy(message = "دعوت‌نامه کاری برای ${worker.fullName} ارسال شد")
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(message = null)
    }
}

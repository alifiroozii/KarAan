package com.karvin.app.presentation.worker.jobs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.domain.usecase.worker.ApplyForJobUseCase
import com.karvin.app.domain.usecase.worker.GetNearbyJobsUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class JobSortOption(val titleFa: String) {
    DISTANCE("نزدیک‌ترین"),
    SALARY("بیشترین دستمزد"),
    RATING("امتیاز کارفرما"),
    SMART_MATCH("تطابق هوشمند"),
    NEWEST("جدیدترین")
}

data class WorkerJobsUiState(
    val searchQuery: String = "",
    val selectedCategoryId: String? = null,
    val selectedCity: String? = null,
    val selectedSort: JobSortOption = JobSortOption.DISTANCE,
    val categories: List<JobCategory> = emptyList(),
    val jobs: List<Job> = emptyList(),
    val selectedJob: Job? = null,
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class WorkerJobsViewModel @Inject constructor(
    private val getNearbyJobsUseCase: GetNearbyJobsUseCase,
    private val applyForJobUseCase: ApplyForJobUseCase,
    private val workerRepository: WorkerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(WorkerJobsUiState())
    val uiState: StateFlow<WorkerJobsUiState> = _uiState.asStateFlow()

    init {
        loadCategories()
        loadJobs()
    }

    private fun loadCategories() {
        viewModelScope.launch {
            workerRepository.getAvailableCategories().collect { cats ->
                _uiState.value = _uiState.value.copy(categories = cats)
            }
        }
    }

    fun loadJobs() {
        val state = _uiState.value
        viewModelScope.launch {
            getNearbyJobsUseCase(state.selectedCity, state.selectedCategoryId, state.searchQuery).collect { list ->
                val sorted = when (state.selectedSort) {
                    JobSortOption.DISTANCE -> list.sortedBy { it.distanceMeters ?: Int.MAX_VALUE }
                    JobSortOption.SALARY -> list.sortedByDescending { it.salaryToman }
                    JobSortOption.RATING -> list.sortedByDescending { it.employerRating }
                    JobSortOption.SMART_MATCH -> list.sortedByDescending { it.matchScorePercentage ?: 0 }
                    JobSortOption.NEWEST -> list.sortedByDescending { it.createdAt }
                }
                _uiState.value = _uiState.value.copy(jobs = sorted)
            }
        }
    }

    fun onSearchQueryChange(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadJobs()
    }

    fun onCategorySelect(categoryId: String?) {
        val newCat = if (_uiState.value.selectedCategoryId == categoryId) null else categoryId
        _uiState.value = _uiState.value.copy(selectedCategoryId = newCat)
        loadJobs()
    }

    fun onSortSelect(sort: JobSortOption) {
        _uiState.value = _uiState.value.copy(selectedSort = sort)
        loadJobs()
    }

    fun onCitySelect(city: String?) {
        _uiState.value = _uiState.value.copy(selectedCity = city)
        loadJobs()
    }

    fun loadJobDetails(jobId: String) {
        viewModelScope.launch {
            getNearbyJobsUseCase.getJobById(jobId).collect { job ->
                _uiState.value = _uiState.value.copy(selectedJob = job)
            }
        }
    }

    fun applyForJob(jobId: String) {
        viewModelScope.launch {
            when (val res = applyForJobUseCase("worker_default", jobId)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(message = "درخواست همکاری شما با موفقیت ثبت شد")
                    loadJobs()
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

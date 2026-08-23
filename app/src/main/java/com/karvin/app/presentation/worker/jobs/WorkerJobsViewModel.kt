package com.karvin.app.presentation.worker.jobs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.repository.ApplicationRepository
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.domain.usecase.worker.ApplyForJobUseCase
import com.karvin.app.domain.usecase.worker.GetNearbyJobsUseCase
import com.karvin.app.domain.usecase.worker.GetWorkerApplicationsUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class JobTabOption(val titleFa: String) {
    ALL("همه فرصت‌ها"),
    SAVED("نشان‌شده‌ها"),
    APPLIED("درخواست‌های من"),
    ACCEPTED("تایید شده"),
    COMPLETED("تکمیل شده")
}

data class WorkerJobsUiState(
    val selectedTab: JobTabOption = JobTabOption.ALL,
    val searchQuery: String = "",
    val selectedCategoryId: String? = null,
    val selectedSort: JobSortOption = JobSortOption.DISTANCE,
    val categories: List<JobCategory> = emptyList(),
    val allJobs: List<Job> = emptyList(),
    val displayJobs: List<Job> = emptyList(),
    val applications: List<JobApplication> = emptyList(),
    val savedJobIds: Set<String> = emptySet(),
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class WorkerJobsViewModel @Inject constructor(
    private val getNearbyJobsUseCase: GetNearbyJobsUseCase,
    private val applyForJobUseCase: ApplyForJobUseCase,
    private val applicationRepository: ApplicationRepository,
    private val workerRepository: WorkerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(WorkerJobsUiState())
    val uiState: StateFlow<WorkerJobsUiState> = _uiState.asStateFlow()

    init {
        loadCategories()
        loadData()
    }

    private fun loadCategories() {
        viewModelScope.launch {
            workerRepository.getAvailableCategories().collect { cats ->
                _uiState.value = _uiState.value.copy(categories = cats)
            }
        }
    }

    private fun loadData() {
        val workerId = "worker_default"
        viewModelScope.launch {
            combine(
                getNearbyJobsUseCase(),
                applicationRepository.getWorkerApplications(workerId)
            ) { jobs, apps ->
                val state = _uiState.value
                val jobsWithApplied = jobs.map { job ->
                    val hasApp = apps.any { it.jobId == job.id && it.status != ApplicationStatus.CANCELLED }
                    job.copy(
                        hasApplied = hasApp,
                        isSaved = state.savedJobIds.contains(job.id)
                    )
                }

                state.copy(
                    allJobs = jobsWithApplied,
                    applications = apps,
                    displayJobs = filterJobs(jobsWithApplied, apps, state)
                )
            }.collect { state ->
                _uiState.value = state
            }
        }
    }

    fun onTabSelect(tab: JobTabOption) {
        val state = _uiState.value
        _uiState.value = state.copy(
            selectedTab = tab,
            displayJobs = filterJobs(state.allJobs, state.applications, state.copy(selectedTab = tab))
        )
    }

    fun onSearchQueryChange(query: String) {
        val state = _uiState.value
        _uiState.value = state.copy(
            searchQuery = query,
            displayJobs = filterJobs(state.allJobs, state.applications, state.copy(searchQuery = query))
        )
    }

    fun onCategorySelect(categoryId: String?) {
        val newCat = if (_uiState.value.selectedCategoryId == categoryId) null else categoryId
        val state = _uiState.value
        _uiState.value = state.copy(
            selectedCategoryId = newCat,
            displayJobs = filterJobs(state.allJobs, state.applications, state.copy(selectedCategoryId = newCat))
        )
    }

    fun onSortSelect(sort: JobSortOption) {
        val state = _uiState.value
        _uiState.value = state.copy(
            selectedSort = sort,
            displayJobs = filterJobs(state.allJobs, state.applications, state.copy(selectedSort = sort))
        )
    }

    fun toggleSaveJob(jobId: String) {
        val currentSaved = _uiState.value.savedJobIds.toMutableSet()
        val isSavedNow: Boolean
        if (currentSaved.contains(jobId)) {
            currentSaved.remove(jobId)
            isSavedNow = false
        } else {
            currentSaved.add(jobId)
            isSavedNow = true
        }

        val updatedJobs = _uiState.value.allJobs.map {
            if (it.id == jobId) it.copy(isSaved = isSavedNow) else it
        }

        val state = _uiState.value.copy(
            savedJobIds = currentSaved,
            allJobs = updatedJobs,
            message = if (isSavedNow) "آگهی به نشان‌شده‌ها اضافه شد" else "آگهی از نشان‌شده‌ها حذف شد"
        )
        _uiState.value = state.copy(
            displayJobs = filterJobs(updatedJobs, state.applications, state)
        )
    }

    fun applyForJob(jobId: String) {
        viewModelScope.launch {
            when (val res = applyForJobUseCase("worker_default", jobId)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(message = "درخواست همکاری با موفقیت برای کارفرما ارسال شد")
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(message = res.message)
                }
                else -> Unit
            }
        }
    }

    fun cancelApplication(jobId: String) {
        viewModelScope.launch {
            val app = _uiState.value.applications.find { it.jobId == jobId }
            if (app != null) {
                applicationRepository.cancelApplication(app.id)
                _uiState.value = _uiState.value.copy(message = "درخواست همکاری لغو شد")
            }
        }
    }

    private fun filterJobs(
        jobs: List<Job>,
        applications: List<JobApplication>,
        state: WorkerJobsUiState
    ): List<Job> {
        var filtered = when (state.selectedTab) {
            JobTabOption.ALL -> jobs
            JobTabOption.SAVED -> jobs.filter { state.savedJobIds.contains(it.id) || it.isSaved }
            JobTabOption.APPLIED -> jobs.filter { job ->
                applications.any { it.jobId == job.id && it.status == ApplicationStatus.PENDING }
            }
            JobTabOption.ACCEPTED -> jobs.filter { job ->
                applications.any { it.jobId == job.id && it.status == ApplicationStatus.ACCEPTED }
            }
            JobTabOption.COMPLETED -> jobs.filter { it.status == com.karvin.app.domain.model.JobStatus.COMPLETED }
        }

        if (state.searchQuery.isNotBlank()) {
            val q = state.searchQuery.trim().lowercase()
            filtered = filtered.filter {
                it.title.lowercase().contains(q) ||
                it.categoryName.lowercase().contains(q) ||
                it.businessName.lowercase().contains(q) ||
                it.address.lowercase().contains(q)
            }
        }

        if (!state.selectedCategoryId.isNullOrBlank()) {
            filtered = filtered.filter { it.categoryId == state.selectedCategoryId }
        }

        filtered = when (state.selectedSort) {
            JobSortOption.DISTANCE -> filtered.sortedBy { it.distanceMeters ?: Int.MAX_VALUE }
            JobSortOption.SALARY -> filtered.sortedByDescending { it.salaryToman }
            JobSortOption.RATING -> filtered.sortedByDescending { it.employerRating }
            JobSortOption.SMART_MATCH -> filtered.sortedByDescending { it.matchScorePercentage ?: 0 }
            JobSortOption.NEWEST -> filtered.sortedByDescending { it.createdAt }
        }

        return filtered
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(message = null)
    }
}

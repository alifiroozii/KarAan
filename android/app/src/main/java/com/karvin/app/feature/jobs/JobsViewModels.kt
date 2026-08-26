@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package com.karvin.app.feature.jobs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.data.FakeData
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.Application
import com.karvin.app.domain.model.CreateJobInput
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobFilter
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.repository.JobRepository
import com.karvin.app.domain.repository.WorkerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import dagger.hilt.android.lifecycle.HiltViewModel

@HiltViewModel
class JobsViewModel @Inject constructor(private val repository: JobRepository) : ViewModel() {
    private val _state = MutableStateFlow(JobListUiState())
    val state: StateFlow<JobListUiState> = _state.asStateFlow()
    private val employerMode = MutableStateFlow(false)
    private val refresh = MutableStateFlow(0)

    init { observe() }

    private fun observe() {
        viewModelScope.launch {
            combine(
                _state.map { it.filter }.distinctUntilChanged(),
                employerMode,
                refresh,
            ) { filter, isEmployer, _ -> filter to isEmployer }
                .flatMapLatest { (filter, isEmployer) ->
                    if (isEmployer) repository.observeMyJobs() else repository.observeJobs(filter, FakeData.center)
                }
                .collect { result ->
                    _state.value = when (result) {
                        is AppResult.Success -> _state.value.copy(loading = false, jobs = result.data, error = null)
                        is AppResult.Error -> _state.value.copy(loading = false, error = result.message)
                        AppResult.Loading -> _state.value.copy(loading = true)
                    }
                }
        }
    }

    fun updateFilter(filter: JobFilter) {
        _state.value = _state.value.copy(filter = filter)
    }

    fun setEmployerMode(enabled: Boolean) {
        employerMode.value = enabled
    }

    fun reload() {
        _state.value = _state.value.copy(loading = true, error = null)
        refresh.value += 1
    }

    fun toggleSave(id: String) { viewModelScope.launch { repository.toggleSaved(id) } }
}

data class JobListUiState(
    val loading: Boolean = true,
    val jobs: List<Job> = emptyList(),
    val filter: JobFilter = JobFilter(),
    val error: String? = null,
)

data class JobDetailsUiState(
    val loading: Boolean = true,
    val job: Job? = null,
    val applicationSent: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class JobDetailsViewModel @Inject constructor(private val repository: JobRepository) : ViewModel() {
    private val _state = MutableStateFlow(JobDetailsUiState())
    val state: StateFlow<JobDetailsUiState> = _state.asStateFlow()

    fun load(id: String) {
        viewModelScope.launch {
            repository.observeJob(id).collect { result ->
                _state.value = when (result) {
                    is AppResult.Success -> _state.value.copy(loading = false, job = result.data, error = null)
                    is AppResult.Error -> _state.value.copy(loading = false, error = result.message)
                    AppResult.Loading -> _state.value.copy(loading = true)
                }
            }
        }
    }

    fun apply(message: String) {
        val id = _state.value.job?.id ?: return
        viewModelScope.launch {
            when (repository.applyToJob(id, message)) {
                is AppResult.Success -> _state.value = _state.value.copy(applicationSent = true)
                is AppResult.Error -> _state.value = _state.value.copy(error = "ارسال درخواست انجام نشد.")
                AppResult.Loading -> Unit
            }
        }
    }

    fun toggleSave() {
        val id = _state.value.job?.id ?: return
        viewModelScope.launch { repository.toggleSaved(id) }
    }

    fun advance(jobId: String, current: JobStatus) {
        val next = when (current) {
            JobStatus.OPEN, JobStatus.APPLIED -> JobStatus.ACCEPTED
            JobStatus.ACCEPTED -> JobStatus.WORKER_ON_THE_WAY
            JobStatus.WORKER_ON_THE_WAY -> JobStatus.ARRIVED
            JobStatus.ARRIVED -> JobStatus.IN_PROGRESS
            JobStatus.IN_PROGRESS -> JobStatus.COMPLETED
            JobStatus.COMPLETED -> JobStatus.RATED
            JobStatus.RATED, JobStatus.CANCELLED -> return
        }
        viewModelScope.launch { repository.updateJobStatus(jobId, next) }
    }
}

data class MyApplicationsUiState(val loading: Boolean = true, val applications: List<Application> = emptyList(), val error: String? = null)

@HiltViewModel
class MyApplicationsViewModel @Inject constructor(private val repository: JobRepository) : ViewModel() {
    private val _state = MutableStateFlow(MyApplicationsUiState())
    val state: StateFlow<MyApplicationsUiState> = _state.asStateFlow()
    init { observe() }

    private fun observe() {
        viewModelScope.launch { repository.observeMyApplications().collect { result -> _state.value = when (result) {
            is AppResult.Success -> MyApplicationsUiState(false, result.data)
            is AppResult.Error -> MyApplicationsUiState(false, error = result.message)
            AppResult.Loading -> MyApplicationsUiState(true)
        } } }
    }

    fun reload() {
        _state.value = _state.value.copy(loading = true, error = null)
        observe()
    }
}

data class JobApplicationsUiState(val loading: Boolean = true, val applications: List<Application> = emptyList(), val error: String? = null)

@HiltViewModel
class JobApplicationsViewModel @Inject constructor(private val repository: JobRepository) : ViewModel() {
    private val _state = MutableStateFlow(JobApplicationsUiState())
    val state: StateFlow<JobApplicationsUiState> = _state.asStateFlow()
    fun load(jobId: String) { viewModelScope.launch { repository.observeApplications(jobId).collect { result -> _state.value = when (result) {
        is AppResult.Success -> JobApplicationsUiState(false, result.data)
        is AppResult.Error -> JobApplicationsUiState(false, error = result.message)
        AppResult.Loading -> JobApplicationsUiState(true)
    } } } }
    fun accept(applicationId: String) { viewModelScope.launch { repository.acceptApplication(applicationId) } }
    fun advance(jobId: String, current: JobStatus) {
        val next = when (current) {
            JobStatus.OPEN, JobStatus.APPLIED -> JobStatus.ACCEPTED
            JobStatus.ACCEPTED -> JobStatus.WORKER_ON_THE_WAY
            JobStatus.WORKER_ON_THE_WAY -> JobStatus.ARRIVED
            JobStatus.ARRIVED -> JobStatus.IN_PROGRESS
            JobStatus.IN_PROGRESS -> JobStatus.COMPLETED
            JobStatus.COMPLETED -> JobStatus.RATED
            JobStatus.RATED, JobStatus.CANCELLED -> return
        }
        viewModelScope.launch { repository.updateJobStatus(jobId, next) }
    }
}

data class CreateJobUiState(val loading: Boolean = false, val published: Job? = null, val error: String? = null)

@HiltViewModel
class CreateJobViewModel @Inject constructor(
    private val repository: JobRepository,
    private val workerRepository: WorkerRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(CreateJobUiState())
    val state: StateFlow<CreateJobUiState> = _state.asStateFlow()
    fun publish(input: CreateJobInput) { viewModelScope.launch {
        _state.value = CreateJobUiState(loading = true)
        _state.value = when (val result = repository.createJob(input)) {
            is AppResult.Success -> CreateJobUiState(published = result.data)
            is AppResult.Error -> CreateJobUiState(error = result.message)
            AppResult.Loading -> CreateJobUiState(loading = true)
        }
    } }

    fun inviteWorker(workerId: String, jobId: String) {
        viewModelScope.launch { workerRepository.inviteWorker(workerId, jobId) }
    }
}

@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package com.karvin.app.feature.home

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.data.FakeData
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.CreateJobInput
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobFilter
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.repository.JobRepository
import com.karvin.app.domain.repository.WorkerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

const val DefaultHomePointLat = 35.7219
const val DefaultHomePointLon = 51.3347
val DefaultHomePoint = GeoPoint(DefaultHomePointLat, DefaultHomePointLon)

data class WorkerHomeUiState(
    val loading: Boolean = true,
    val user: User = FakeData.workers.first(),
    val jobs: List<Job> = emptyList(),
    val isAvailable: Boolean = false,
    val filter: JobFilter = JobFilter(),
    val error: String? = null,
)

sealed interface WorkerHomeEvent {
    data class QueryChanged(val value: String) : WorkerHomeEvent
    data class ToggleAvailability(val enabled: Boolean) : WorkerHomeEvent
    data class CategorySelected(val id: String?) : WorkerHomeEvent
    data class SaveJob(val id: String) : WorkerHomeEvent
    data object Retry : WorkerHomeEvent
}

@HiltViewModel
class WorkerHomeViewModel @Inject constructor(
    private val workerRepository: WorkerRepository,
    private val jobRepository: JobRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(WorkerHomeUiState())
    val state: StateFlow<WorkerHomeUiState> = _state.asStateFlow()

    init { observe() }

    private fun observe() {
        viewModelScope.launch {
            workerRepository.observeWorker(FakeData.workers.first().id).collect { result ->
                if (result is AppResult.Success) _state.value = _state.value.copy(user = result.data, isAvailable = result.data.isAvailable)
            }
        }
        viewModelScope.launch {
            _state
                .map { it.filter }
                .distinctUntilChanged()
                .flatMapLatest { filter -> jobRepository.observeJobs(filter, DefaultHomePoint) }
                .collect { result ->
                    _state.value = when (result) {
                        is AppResult.Success -> _state.value.copy(loading = false, jobs = result.data, error = null)
                        is AppResult.Error -> _state.value.copy(loading = false, error = result.message)
                        AppResult.Loading -> _state.value.copy(loading = true)
                    }
                }
        }
    }

    fun onEvent(event: WorkerHomeEvent) {
        when (event) {
            is WorkerHomeEvent.QueryChanged -> _state.value = _state.value.copy(filter = _state.value.filter.copy(query = event.value))
            is WorkerHomeEvent.CategorySelected -> _state.value = _state.value.copy(filter = _state.value.filter.copy(categoryId = event.id))
            is WorkerHomeEvent.ToggleAvailability -> viewModelScope.launch {
                workerRepository.toggleAvailability(event.enabled)
            }
            is WorkerHomeEvent.SaveJob -> viewModelScope.launch { jobRepository.toggleSaved(event.id) }
            WorkerHomeEvent.Retry -> observe()
        }
    }
}

data class EmployerHomeUiState(
    val loading: Boolean = true,
    val user: User = FakeData.employers.first(),
    val myJobs: List<Job> = emptyList(),
    val error: String? = null,
)

@HiltViewModel
class EmployerHomeViewModel @Inject constructor(
    private val jobRepository: JobRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(EmployerHomeUiState())
    val state: StateFlow<EmployerHomeUiState> = _state.asStateFlow()

    init { observe() }

    private fun observe() {
        viewModelScope.launch {
            jobRepository.observeMyJobs().collect { result ->
                _state.value = when (result) {
                    is AppResult.Success -> _state.value.copy(loading = false, myJobs = result.data, error = null)
                    is AppResult.Error -> _state.value.copy(loading = false, error = result.message)
                    AppResult.Loading -> _state.value.copy(loading = true)
                }
            }
        }
    }

    fun reload() {
        _state.value = _state.value.copy(loading = true, error = null)
        observe()
    }

    fun createJob(input: CreateJobInput, onDone: (Job?) -> Unit) {
        viewModelScope.launch {
            onDone((jobRepository.createJob(input) as? AppResult.Success)?.data)
        }
    }
}

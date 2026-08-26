@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package com.karvin.app.feature.workers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.data.FakeData
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.DistanceFilter
import com.karvin.app.domain.model.RatingInput
import com.karvin.app.domain.model.Review
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.WorkerFilter
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.feature.home.DefaultHomePoint
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class WorkersViewModel @Inject constructor(private val repository: WorkerRepository) : ViewModel() {
    private val _state = MutableStateFlow(WorkersUiState())
    val state: StateFlow<WorkersUiState> = _state.asStateFlow()
    init { observe() }
    private fun observe() {
        viewModelScope.launch {
            _state
                .map { it.filter }
                .distinctUntilChanged()
                .flatMapLatest { filter -> repository.observeWorkers(filter, DefaultHomePoint) }
                .collect { result ->
                    _state.value = when (result) {
                        is AppResult.Success -> _state.value.copy(loading = false, workers = result.data, error = null)
                        is AppResult.Error -> _state.value.copy(loading = false, error = result.message)
                        AppResult.Loading -> _state.value.copy(loading = true)
                    }
                }
        }
    }
    fun updateFilter(filter: WorkerFilter) { _state.value = _state.value.copy(filter = filter) }
    fun favorite(id: String) { viewModelScope.launch { repository.toggleFavorite(id) } }
}

data class WorkersUiState(val loading: Boolean = true, val workers: List<User> = emptyList(), val filter: WorkerFilter = WorkerFilter(), val error: String? = null)

data class WorkerProfileUiState(val loading: Boolean = true, val worker: User? = null, val reviews: List<Review> = emptyList(), val error: String? = null)

@HiltViewModel
class WorkerProfileViewModel @Inject constructor(private val repository: WorkerRepository) : ViewModel() {
    private val _state = MutableStateFlow(WorkerProfileUiState())
    val state: StateFlow<WorkerProfileUiState> = _state.asStateFlow()
    fun load(id: String) {
        viewModelScope.launch { repository.observeWorker(id).collect { result -> _state.value = when (result) {
            is AppResult.Success -> _state.value.copy(loading = false, worker = result.data, error = null)
            is AppResult.Error -> _state.value.copy(loading = false, error = result.message)
            AppResult.Loading -> _state.value.copy(loading = true)
        } } }
        viewModelScope.launch { repository.observeReviews(id).collect { result -> if (result is AppResult.Success) _state.value = _state.value.copy(reviews = result.data) } }
    }
}

@HiltViewModel
class RatingViewModel @Inject constructor(private val repository: WorkerRepository) : ViewModel() {
    private val _state = MutableStateFlow<RatingUiState>(RatingUiState.Idle)
    val state: StateFlow<RatingUiState> = _state.asStateFlow()
    fun submit(targetId: String, rating: Int, comment: String) { viewModelScope.launch {
        _state.value = RatingUiState.Loading
        _state.value = when (val result = repository.rateWorker(RatingInput(targetId, rating, comment))) {
            is AppResult.Success -> RatingUiState.Done(result.data)
            is AppResult.Error -> RatingUiState.Error(result.message)
            AppResult.Loading -> RatingUiState.Loading
        }
    } }
}

sealed interface RatingUiState { data object Idle : RatingUiState; data object Loading : RatingUiState; data class Done(val review: Review) : RatingUiState; data class Error(val message: String) : RatingUiState }

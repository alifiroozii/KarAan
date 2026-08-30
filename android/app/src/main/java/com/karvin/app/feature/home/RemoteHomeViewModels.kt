package com.karvin.app.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.core.common.ApiResult
import com.karvin.app.core.common.UiState
import com.karvin.app.domain.model.CreateJobRequest
import com.karvin.app.domain.model.GeoPoint
import com.karvin.app.domain.model.JobRequest
import com.karvin.app.domain.repository.RemoteJobRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class RemoteRequesterHomeViewModel @Inject constructor(
    private val repository: RemoteJobRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<UiState<List<JobRequest>>>(UiState.Loading)
    val state: StateFlow<UiState<List<JobRequest>>> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = repository.getMyJobs().toUiState()
        }
    }
}

@HiltViewModel
class RemoteProviderHomeViewModel @Inject constructor(
    private val repository: RemoteJobRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<UiState<List<JobRequest>>>(UiState.Loading)
    val state: StateFlow<UiState<List<JobRequest>>> = _state.asStateFlow()

    init { load() }

    fun load(point: GeoPoint = DefaultHomePoint, radiusKm: Double? = null) {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = repository.getNearbyJobs(point.latitude, point.longitude, radiusKm).toUiState()
        }
    }
}

private fun <T> ApiResult<T>.toUiState(): UiState<T> = when (this) {
    ApiResult.Loading -> UiState.Loading
    is ApiResult.Success -> UiState.Success(data)
    is ApiResult.Error -> UiState.Error(message, canRetry = true)
}

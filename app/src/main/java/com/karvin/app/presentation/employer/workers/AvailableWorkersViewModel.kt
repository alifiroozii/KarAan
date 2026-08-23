package com.karvin.app.presentation.employer.workers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.model.JobInvitation
import com.karvin.app.domain.model.LocationPoint
import com.karvin.app.domain.model.WorkerAvailabilityStatus
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.InvitationRepository
import com.karvin.app.domain.repository.LocationRepository
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.domain.usecase.location.GetCurrentLocationUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class WorkerSortOption(val titleFa: String) {
    DISTANCE("نزدیک‌ترین"),
    RATING("بالاترین امتیاز"),
    EXPERIENCE("بیشترین سابقه"),
    COMPLETED_JOBS("بیشترین کار موفق")
}

data class AvailableWorkersUiState(
    val workers: List<WorkerProfile> = emptyList(),
    val filteredWorkers: List<WorkerProfile> = emptyList(),
    val categories: List<JobCategory> = emptyList(),
    val searchQuery: String = "",
    val selectedCategoryId: String? = null,
    val selectedSort: WorkerSortOption = WorkerSortOption.DISTANCE,
    val onlyAvailableNow: Boolean = true,
    val selectedWorkerForInvite: WorkerProfile? = null,
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class AvailableWorkersViewModel @Inject constructor(
    private val locationRepository: LocationRepository,
    private val workerRepository: WorkerRepository,
    private val invitationRepository: InvitationRepository,
    private val getCurrentLocationUseCase: GetCurrentLocationUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AvailableWorkersUiState())
    val uiState: StateFlow<AvailableWorkersUiState> = _uiState.asStateFlow()

    init {
        loadCategories()
        loadWorkers()
    }

    private fun loadCategories() {
        viewModelScope.launch {
            workerRepository.getAvailableCategories().collect { cats ->
                _uiState.value = _uiState.value.copy(categories = cats)
            }
        }
    }

    fun loadWorkers() {
        viewModelScope.launch {
            locationRepository.getNearbyWorkersOnMap(LocationPoint.DEFAULT_TEHRAN, radiusKm = 25.0).collect { list ->
                _uiState.value = _uiState.value.copy(
                    workers = list,
                    filteredWorkers = applyFilters(list, _uiState.value)
                )
            }
        }
    }

    fun onSearchQueryChange(query: String) {
        _uiState.value = _uiState.value.copy(
            searchQuery = query,
            filteredWorkers = applyFilters(_uiState.value.workers, _uiState.value.copy(searchQuery = query))
        )
    }

    fun onCategorySelect(categoryId: String?) {
        val newCat = if (_uiState.value.selectedCategoryId == categoryId) null else categoryId
        _uiState.value = _uiState.value.copy(
            selectedCategoryId = newCat,
            filteredWorkers = applyFilters(_uiState.value.workers, _uiState.value.copy(selectedCategoryId = newCat))
        )
    }

    fun onSortSelect(sort: WorkerSortOption) {
        _uiState.value = _uiState.value.copy(
            selectedSort = sort,
            filteredWorkers = applyFilters(_uiState.value.workers, _uiState.value.copy(selectedSort = sort))
        )
    }

    fun toggleOnlyAvailableNow(only: Boolean) {
        _uiState.value = _uiState.value.copy(
            onlyAvailableNow = only,
            filteredWorkers = applyFilters(_uiState.value.workers, _uiState.value.copy(onlyAvailableNow = only))
        )
    }

    fun openInviteDialog(worker: WorkerProfile) {
        _uiState.value = _uiState.value.copy(selectedWorkerForInvite = worker)
    }

    fun closeInviteDialog() {
        _uiState.value = _uiState.value.copy(selectedWorkerForInvite = null)
    }

    fun sendInvitation(invitation: JobInvitation) {
        viewModelScope.launch {
            when (val res = invitationRepository.sendInvitation(invitation)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        selectedWorkerForInvite = null,
                        message = "دعوت‌نامه همکاری با موفقیت برای ${invitation.workerName} ارسال شد"
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(message = res.message)
                }
                else -> Unit
            }
        }
    }

    private fun applyFilters(list: List<WorkerProfile>, state: AvailableWorkersUiState): List<WorkerProfile> {
        var result = list

        if (state.searchQuery.isNotBlank()) {
            val q = state.searchQuery.trim().lowercase()
            result = result.filter { w ->
                w.fullName.lowercase().contains(q) ||
                w.primarySkill.lowercase().contains(q) ||
                w.skills.any { it.nameFa.lowercase().contains(q) } ||
                w.address.lowercase().contains(q)
            }
        }

        if (!state.selectedCategoryId.isNullOrBlank()) {
            result = result.filter { w -> w.categories.any { it.id == state.selectedCategoryId } }
        }

        if (state.onlyAvailableNow) {
            result = result.filter { it.isAvailableNow }
        }

        result = when (state.selectedSort) {
            WorkerSortOption.DISTANCE -> result.sortedBy { it.distanceMeters ?: Int.MAX_VALUE }
            WorkerSortOption.RATING -> result.sortedByDescending { it.rating }
            WorkerSortOption.EXPERIENCE -> result.sortedByDescending { it.experienceYears }
            WorkerSortOption.COMPLETED_JOBS -> result.sortedByDescending { it.completedJobsCount }
        }

        return result
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(message = null)
    }
}

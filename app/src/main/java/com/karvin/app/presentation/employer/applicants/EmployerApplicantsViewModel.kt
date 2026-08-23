package com.karvin.app.presentation.employer.applicants

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.domain.model.JobApplication
import com.karvin.app.domain.model.Rating
import com.karvin.app.domain.usecase.employer.GetJobApplicantsUseCase
import com.karvin.app.domain.usecase.employer.RateWorkerUseCase
import com.karvin.app.domain.usecase.employer.UpdateApplicantStatusUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class EmployerApplicantsUiState(
    val applicants: List<JobApplication> = emptyList(),
    val selectedStatusFilter: ApplicationStatus? = null,
    val selectedApplicantForRating: JobApplication? = null,
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class EmployerApplicantsViewModel @Inject constructor(
    private val getJobApplicantsUseCase: GetJobApplicantsUseCase,
    private val updateApplicantStatusUseCase: UpdateApplicantStatusUseCase,
    private val rateWorkerUseCase: RateWorkerUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(EmployerApplicantsUiState())
    val uiState: StateFlow<EmployerApplicantsUiState> = _uiState.asStateFlow()

    init {
        loadApplicants()
    }

    private fun loadApplicants() {
        viewModelScope.launch {
            getJobApplicantsUseCase("emp_101").collect { list ->
                _uiState.value = _uiState.value.copy(applicants = list)
            }
        }
    }

    fun setFilter(status: ApplicationStatus?) {
        _uiState.value = _uiState.value.copy(selectedStatusFilter = status)
    }

    fun acceptApplicant(application: JobApplication) {
        viewModelScope.launch {
            when (val res = updateApplicantStatusUseCase(application.id, ApplicationStatus.ACCEPTED)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(message = "نیرو با موفقیت تایید شد و شیفت ایجاد گردید")
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(message = res.message)
                }
                else -> Unit
            }
        }
    }

    fun rejectApplicant(application: JobApplication) {
        viewModelScope.launch {
            when (val res = updateApplicantStatusUseCase(application.id, ApplicationStatus.REJECTED)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(message = "درخواست نیرو رد شد")
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(message = res.message)
                }
                else -> Unit
            }
        }
    }

    fun openRatingDialog(application: JobApplication) {
        _uiState.value = _uiState.value.copy(selectedApplicantForRating = application)
    }

    fun dismissRatingDialog() {
        _uiState.value = _uiState.value.copy(selectedApplicantForRating = null)
    }

    fun submitRating(score: Float, comment: String) {
        val app = _uiState.value.selectedApplicantForRating ?: return
        viewModelScope.launch {
            val rating = Rating(
                id = "rate_${UUID.randomUUID().toString().take(8)}",
                raterId = "emp_101",
                raterName = "مهندس علیرضا رضایی",
                targetUserId = app.workerId,
                jobId = app.jobId,
                score = score,
                comment = comment.ifBlank { null }
            )
            when (val res = rateWorkerUseCase(rating)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        selectedApplicantForRating = null,
                        message = "امتیاز و بازخورد شما با موفقیت ثبت شد"
                    )
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

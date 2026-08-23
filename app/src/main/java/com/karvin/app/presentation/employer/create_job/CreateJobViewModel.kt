package com.karvin.app.presentation.employer.create_job

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.Skill
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.domain.usecase.employer.CreateJobPostUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class CreateJobUiState(
    val title: String = "",
    val description: String = "",
    val selectedCategory: JobCategory? = null,
    val numberOfWorkers: String = "2",
    val date: String = "۱۴۰۳/۰۶/۱۰",
    val startTime: String = "۰۸:۰۰",
    val endTime: String = "۱۷:۰۰",
    val salaryToman: String = "1200000",
    val isHourlySalary: Boolean = false,
    val city: String = "تهران",
    val address: String = "",
    val selectedSkills: List<Skill> = emptyList(),
    val availableCategories: List<JobCategory> = emptyList(),
    val availableSkills: List<Skill> = emptyList(),
    val isUrgent: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false
)

@HiltViewModel
class CreateJobViewModel @Inject constructor(
    private val createJobPostUseCase: CreateJobPostUseCase,
    private val workerRepository: WorkerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CreateJobUiState())
    val uiState: StateFlow<CreateJobUiState> = _uiState.asStateFlow()

    init {
        loadCategoriesAndSkills()
    }

    private fun loadCategoriesAndSkills() {
        viewModelScope.launch {
            workerRepository.getAvailableCategories().collect { cats ->
                _uiState.value = _uiState.value.copy(
                    availableCategories = cats,
                    selectedCategory = cats.firstOrNull()
                )
            }
        }
        viewModelScope.launch {
            workerRepository.getAvailableSkills().collect { sks ->
                _uiState.value = _uiState.value.copy(availableSkills = sks)
            }
        }
    }

    fun onTitleChange(value: String) { _uiState.value = _uiState.value.copy(title = value, errorMessage = null) }
    fun onDescriptionChange(value: String) { _uiState.value = _uiState.value.copy(description = value, errorMessage = null) }
    fun onCategorySelect(category: JobCategory) { _uiState.value = _uiState.value.copy(selectedCategory = category) }
    fun onNumberOfWorkersChange(value: String) { _uiState.value = _uiState.value.copy(numberOfWorkers = value) }
    fun onDateChange(value: String) { _uiState.value = _uiState.value.copy(date = value) }
    fun onStartTimeChange(value: String) { _uiState.value = _uiState.value.copy(startTime = value) }
    fun onEndTimeChange(value: String) { _uiState.value = _uiState.value.copy(endTime = value) }
    fun onSalaryChange(value: String) { _uiState.value = _uiState.value.copy(salaryToman = value) }
    fun onHourlyToggle(isHourly: Boolean) { _uiState.value = _uiState.value.copy(isHourlySalary = isHourly) }
    fun onCityChange(value: String) { _uiState.value = _uiState.value.copy(city = value) }
    fun onAddressChange(value: String) { _uiState.value = _uiState.value.copy(address = value) }
    fun onUrgentToggle(isUrgent: Boolean) { _uiState.value = _uiState.value.copy(isUrgent = isUrgent) }

    fun toggleSkill(skill: Skill) {
        val current = _uiState.value.selectedSkills.toMutableList()
        if (current.any { it.id == skill.id }) {
            current.removeAll { it.id == skill.id }
        } else {
            current.add(skill)
        }
        _uiState.value = _uiState.value.copy(selectedSkills = current)
    }

    fun submitJob() {
        val s = _uiState.value
        val salary = s.salaryToman.toLongOrNull() ?: 0L
        val workersCount = s.numberOfWorkers.toIntOrNull() ?: 1

        if (s.title.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "عنوان شغل الزامی است")
            return
        }
        if (s.description.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "شرح وظایف الزامی است")
            return
        }
        if (salary <= 0) {
            _uiState.value = _uiState.value.copy(errorMessage = "مبلغ دستمزد باید بیشتر از صفر باشد")
            return
        }
        if (s.address.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "آدرس محل کار الزامی است")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val job = Job(
                id = "job_${UUID.randomUUID().toString().take(8)}",
                employerId = "emp_101",
                employerName = "مهندس علیرضا رضایی",
                businessName = "شرکت ساختمانی سازه گستر البرز",
                title = s.title,
                description = s.description,
                categoryId = s.selectedCategory?.id ?: "cat_1",
                categoryName = s.selectedCategory?.nameFa ?: "عمومی",
                numberOfWorkersNeeded = workersCount,
                currentWorkersCount = 0,
                date = s.date,
                startTime = s.startTime,
                endTime = s.endTime,
                salaryToman = salary,
                isHourlySalary = s.isHourlySalary,
                city = s.city,
                address = s.address,
                requiredSkills = s.selectedSkills.map { it.nameFa },
                status = JobStatus.OPEN,
                isUrgent = s.isUrgent
            )

            when (val res = createJobPostUseCase(job)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, isSuccess = true)
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = res.message)
                }
                else -> Unit
            }
        }
    }
}

package com.karvin.app.presentation.auth.worker_register

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.Gender
import com.karvin.app.domain.model.JobCategory
import com.karvin.app.domain.model.Skill
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.domain.repository.WorkerRepository
import com.karvin.app.domain.usecase.auth.RegisterWorkerUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class WorkerRegisterState(
    val currentStep: Int = 1, // 1: Personal, 2: Professional, 3: Availability
    // Step 1: Personal
    val fullName: String = "",
    val nationalId: String = "",
    val birthDate: String = "1375/01/01",
    val gender: Gender = Gender.MALE,
    val phoneNumber: String = "09123456789",
    // Step 2: Professional
    val selectedSkills: List<Skill> = emptyList(),
    val selectedCategories: List<JobCategory> = emptyList(),
    val experienceYears: String = "4",
    val city: String = "تهران",
    val address: String = "ستارخان، خسرو شمالی",
    // Step 3: Availability
    val selectedDays: List<String> = listOf("شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"),
    val availableHours: String = "۰۸:۰۰ الی ۱۸:۰۰",
    val preferredJobs: String = "برق‌کاری صنعتی، تاسیسات",
    // Options
    val availableCategoriesList: List<JobCategory> = emptyList(),
    val availableSkillsList: List<Skill> = emptyList(),
    // Status
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val registrationSuccessUser: User? = null
)

@HiltViewModel
class WorkerRegisterViewModel @Inject constructor(
    private val registerWorkerUseCase: RegisterWorkerUseCase,
    private val workerRepository: WorkerRepository
) : ViewModel() {

    private val _state = MutableStateFlow(WorkerRegisterState())
    val state: StateFlow<WorkerRegisterState> = _state.asStateFlow()

    init {
        loadCategoriesAndSkills()
    }

    private fun loadCategoriesAndSkills() {
        viewModelScope.launch {
            workerRepository.getAvailableCategories().collect { cats ->
                _state.value = _state.value.copy(
                    availableCategoriesList = cats,
                    selectedCategories = if (cats.isNotEmpty()) listOf(cats.first()) else emptyList()
                )
            }
        }
        viewModelScope.launch {
            workerRepository.getAvailableSkills().collect { sks ->
                _state.value = _state.value.copy(
                    availableSkillsList = sks,
                    selectedSkills = if (sks.size >= 2) sks.take(2) else sks
                )
            }
        }
    }

    // Step 1 Mutations
    fun onFullNameChange(value: String) { _state.value = _state.value.copy(fullName = value, errorMessage = null) }
    fun onNationalIdChange(value: String) { _state.value = _state.value.copy(nationalId = value, errorMessage = null) }
    fun onBirthDateChange(value: String) { _state.value = _state.value.copy(birthDate = value) }
    fun onGenderChange(gender: Gender) { _state.value = _state.value.copy(gender = gender) }

    // Step 2 Mutations
    fun toggleSkill(skill: Skill) {
        val current = _state.value.selectedSkills.toMutableList()
        if (current.any { it.id == skill.id }) {
            current.removeAll { it.id == skill.id }
        } else {
            current.add(skill)
        }
        _state.value = _state.value.copy(selectedSkills = current)
    }

    fun toggleCategory(cat: JobCategory) {
        val current = _state.value.selectedCategories.toMutableList()
        if (current.any { it.id == cat.id }) {
            current.removeAll { it.id == cat.id }
        } else {
            current.add(cat)
        }
        _state.value = _state.value.copy(selectedCategories = current)
    }

    fun onExperienceYearsChange(value: String) { _state.value = _state.value.copy(experienceYears = value) }
    fun onCityChange(value: String) { _state.value = _state.value.copy(city = value) }
    fun onAddressChange(value: String) { _state.value = _state.value.copy(address = value) }

    // Step 3 Mutations
    fun toggleDay(day: String) {
        val current = _state.value.selectedDays.toMutableList()
        if (current.contains(day)) {
            current.remove(day)
        } else {
            current.add(day)
        }
        _state.value = _state.value.copy(selectedDays = current)
    }

    fun onAvailableHoursChange(value: String) { _state.value = _state.value.copy(availableHours = value) }
    fun onPreferredJobsChange(value: String) { _state.value = _state.value.copy(preferredJobs = value) }

    // Navigation between steps
    fun nextStep() {
        val cur = _state.value.currentStep
        if (cur == 1) {
            if (_state.value.fullName.isBlank()) {
                _state.value = _state.value.copy(errorMessage = "نام و نام خانوادگی الزامی است")
                return
            }
            if (_state.value.nationalId.length != 10) {
                _state.value = _state.value.copy(errorMessage = "کد ملی باید ۱۰ رقم باشد")
                return
            }
            _state.value = _state.value.copy(currentStep = 2, errorMessage = null)
        } else if (cur == 2) {
            if (_state.value.selectedSkills.isEmpty()) {
                _state.value = _state.value.copy(errorMessage = "حداقل یک مهارت کاری انتخاب کنید")
                return
            }
            if (_state.value.city.isBlank()) {
                _state.value = _state.value.copy(errorMessage = "شهر محل سکونت الزامی است")
                return
            }
            _state.value = _state.value.copy(currentStep = 3, errorMessage = null)
        }
    }

    fun previousStep() {
        val cur = _state.value.currentStep
        if (cur > 1) {
            _state.value = _state.value.copy(currentStep = cur - 1, errorMessage = null)
        }
    }

    fun completeRegistration() {
        val s = _state.value
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, errorMessage = null)
            val profile = WorkerProfile(
                userId = "worker_${UUID.randomUUID().toString().take(8)}",
                fullName = s.fullName,
                nationalId = s.nationalId,
                birthDate = s.birthDate,
                gender = s.gender,
                avatarUrl = null,
                skills = s.selectedSkills,
                categories = s.selectedCategories,
                experienceYears = s.experienceYears.toIntOrNull() ?: 1,
                city = s.city,
                address = s.address,
                availableDays = s.selectedDays,
                availableHours = s.availableHours,
                preferredJobs = s.preferredJobs.split("،", ",").map { it.trim() }.filter { it.isNotBlank() },
                rating = 5.0f,
                completedJobsCount = 0,
                isAvailableForWork = true,
                totalEarningsToman = 0
            )

            when (val res = registerWorkerUseCase(profile)) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(isLoading = false, registrationSuccessUser = res.data)
                }
                is Resource.Error -> {
                    _state.value = _state.value.copy(isLoading = false, errorMessage = res.message)
                }
                else -> Unit
            }
        }
    }
}

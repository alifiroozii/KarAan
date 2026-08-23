package com.karvin.app.presentation.auth.worker_register

import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationCity
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.domain.model.Gender
import com.karvin.app.domain.model.UserRole
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.KarvinFilterChip
import com.karvin.app.presentation.components.KarvinTextField
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.BorderLight
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy100
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.Red500
import com.karvin.app.presentation.theme.TextSecondaryLight

@Composable
fun WorkerRegisterScreen(
    onNavigateBack: () -> Unit,
    onRegisterSuccess: (UserRole) -> Unit,
    viewModel: WorkerRegisterViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state.registrationSuccessUser) {
        val user = state.registrationSuccessUser
        if (user != null) {
            onRegisterSuccess(UserRole.WORKER)
        }
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.worker_reg_title),
                onBackClick = {
                    if (state.currentStep > 1) {
                        viewModel.previousStep()
                    } else {
                        onNavigateBack()
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 20.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Step Indicator Header
            StepProgressBar(currentStep = state.currentStep)

            Spacer(modifier = Modifier.height(16.dp))

            if (state.errorMessage != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(Red500.copy(alpha = 0.1f))
                        .padding(12.dp)
                ) {
                    Text(
                        text = state.errorMessage ?: "",
                        style = MaterialTheme.typography.bodySmall,
                        color = Red500,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            Box(modifier = Modifier.weight(1f)) {
                when (state.currentStep) {
                    1 -> StepPersonalInfo(state = state, viewModel = viewModel)
                    2 -> StepProfessionalInfo(state = state, viewModel = viewModel)
                    3 -> StepAvailabilityInfo(state = state, viewModel = viewModel)
                }
            }

            // Bottom Navigation Actions
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (state.currentStep > 1) {
                    KarvinButton(
                        text = stringResource(id = R.string.prev_step),
                        onClick = viewModel::previousStep,
                        type = KarvinButtonType.OUTLINED,
                        modifier = Modifier.weight(1f)
                    )
                }

                if (state.currentStep < 3) {
                    KarvinButton(
                        text = stringResource(id = R.string.next_step),
                        onClick = viewModel::nextStep,
                        type = KarvinButtonType.SECONDARY,
                        modifier = Modifier.weight(if (state.currentStep > 1) 1f else 2f)
                    )
                } else {
                    KarvinButton(
                        text = stringResource(id = R.string.complete_registration),
                        onClick = viewModel::completeRegistration,
                        type = KarvinButtonType.SECONDARY,
                        isLoading = state.isLoading,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun StepProgressBar(currentStep: Int) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        StepNode(number = 1, title = "اطلاعات فردی", isActive = currentStep >= 1, isCompleted = currentStep > 1)
        Box(modifier = Modifier.weight(1f).height(2.dp).background(if (currentStep > 1) Emerald600 else BorderLight))
        StepNode(number = 2, title = "مهارت و شغل", isActive = currentStep >= 2, isCompleted = currentStep > 2)
        Box(modifier = Modifier.weight(1f).height(2.dp).background(if (currentStep > 2) Emerald600 else BorderLight))
        StepNode(number = 3, title = "زمان‌بندی", isActive = currentStep >= 3, isCompleted = false)
    }
}

@Composable
private fun StepNode(number: Int, title: String, isActive: Boolean, isCompleted: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(if (isActive) (if (isCompleted) Emerald600 else Navy900) else BorderLight),
            contentAlignment = Alignment.Center
        ) {
            if (isCompleted) {
                Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
            } else {
                Text(
                    text = number.toString(),
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (isActive) Color.White else TextSecondaryLight
                )
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
            color = if (isActive) MaterialTheme.colorScheme.onSurface else TextSecondaryLight
        )
    }
}

@Composable
private fun StepPersonalInfo(state: WorkerRegisterState, viewModel: WorkerRegisterViewModel) {
    val scroll = rememberScrollState()
    Column(modifier = Modifier.fillMaxSize().verticalScroll(scroll)) {
        KarvinTextField(
            value = state.fullName,
            onValueChange = viewModel::onFullNameChange,
            label = stringResource(id = R.string.full_name_label),
            placeholder = "مثال: علی محمدی",
            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = Navy900) }
        )
        Spacer(modifier = Modifier.height(14.dp))
        KarvinTextField(
            value = state.nationalId,
            onValueChange = viewModel::onNationalIdChange,
            label = stringResource(id = R.string.national_id_label),
            placeholder = "کد ملی ۱۰ رقمی",
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            leadingIcon = { Icon(Icons.Default.Badge, contentDescription = null, tint = Navy900) }
        )
        Spacer(modifier = Modifier.height(14.dp))
        KarvinTextField(
            value = state.birthDate,
            onValueChange = viewModel::onBirthDateChange,
            label = stringResource(id = R.string.birth_date_label),
            placeholder = "۱۳۷۵/۰۱/۰۱",
            leadingIcon = { Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Navy900) }
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = stringResource(id = R.string.gender_label), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Medium)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onGenderChange(Gender.MALE) }) {
                RadioButton(
                    selected = state.gender == Gender.MALE,
                    onClick = { viewModel.onGenderChange(Gender.MALE) },
                    colors = RadioButtonDefaults.colors(selectedColor = Emerald600)
                )
                Text(text = stringResource(id = R.string.gender_male), style = MaterialTheme.typography.bodyMedium)
            }
            Spacer(modifier = Modifier.width(24.dp))
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onGenderChange(Gender.FEMALE) }) {
                RadioButton(
                    selected = state.gender == Gender.FEMALE,
                    onClick = { viewModel.onGenderChange(Gender.FEMALE) },
                    colors = RadioButtonDefaults.colors(selectedColor = Emerald600)
                )
                Text(text = stringResource(id = R.string.gender_female), style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun StepProfessionalInfo(state: WorkerRegisterState, viewModel: WorkerRegisterViewModel) {
    val scroll = rememberScrollState()
    Column(modifier = Modifier.fillMaxSize().verticalScroll(scroll)) {
        Text(text = "انتخاب مهارت‌های کاری:", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            state.availableSkillsList.forEach { skill ->
                val isSelected = state.selectedSkills.any { it.id == skill.id }
                KarvinFilterChip(text = skill.nameFa, isSelected = isSelected, onClick = { viewModel.toggleSkill(skill) })
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        KarvinTextField(
            value = state.experienceYears,
            onValueChange = viewModel::onExperienceYearsChange,
            label = stringResource(id = R.string.experience_years_label),
            placeholder = "مثال: ۴",
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
        )
        Spacer(modifier = Modifier.height(14.dp))
        KarvinTextField(
            value = state.city,
            onValueChange = viewModel::onCityChange,
            label = stringResource(id = R.string.city_label),
            placeholder = "تهران، کرج، اصفهان...",
            leadingIcon = { Icon(Icons.Default.LocationCity, contentDescription = null, tint = Navy900) }
        )
        Spacer(modifier = Modifier.height(14.dp))
        KarvinTextField(
            value = state.address,
            onValueChange = viewModel::onAddressChange,
            label = stringResource(id = R.string.address_label),
            placeholder = "نام محله یا خیابان اصلی"
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun StepAvailabilityInfo(state: WorkerRegisterState, viewModel: WorkerRegisterViewModel) {
    val scroll = rememberScrollState()
    val allDays = listOf("شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه")
    Column(modifier = Modifier.fillMaxSize().verticalScroll(scroll)) {
        Text(text = "روزهای کاری در دسترس:", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            allDays.forEach { day ->
                val isSelected = state.selectedDays.contains(day)
                KarvinFilterChip(text = day, isSelected = isSelected, onClick = { viewModel.toggleDay(day) })
            }
        }
        Spacer(modifier = Modifier.height(18.dp))
        KarvinTextField(
            value = state.availableHours,
            onValueChange = viewModel::onAvailableHoursChange,
            label = stringResource(id = R.string.available_hours_label),
            placeholder = "مثلاً: ۰۸:۰۰ الی ۱۸:۰۰ یا شیفت عصر"
        )
        Spacer(modifier = Modifier.height(14.dp))
        KarvinTextField(
            value = state.preferredJobs,
            onValueChange = viewModel::onPreferredJobsChange,
            label = stringResource(id = R.string.preferred_jobs_label),
            placeholder = "علاقه‌مندی‌های شغلی (با ویرگول جدا کنید)"
        )
    }
}

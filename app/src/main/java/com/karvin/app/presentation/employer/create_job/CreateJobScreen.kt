package com.karvin.app.presentation.employer.create_job

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.LocationCity
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Whatshot
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.KarvinFilterChip
import com.karvin.app.presentation.components.KarvinTextField
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.Red100
import com.karvin.app.presentation.theme.Red500
import com.karvin.app.presentation.theme.TextSecondaryLight

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CreateJobScreen(
    onNavigateBack: () -> Unit,
    onJobCreatedSuccess: () -> Unit,
    viewModel: CreateJobViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val categoryScroll = rememberScrollState()

    LaunchedEffect(state.isSuccess) {
        if (state.isSuccess) {
            onJobCreatedSuccess()
        }
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.create_job_banner_btn),
                onBackClick = onNavigateBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
                .verticalScroll(scrollState),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Spacer(modifier = Modifier.height(6.dp))

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
            }

            // Job Title & Description
            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                    KarvinTextField(
                        value = state.title,
                        onValueChange = viewModel::onTitleChange,
                        label = stringResource(id = R.string.job_title_label),
                        placeholder = "مثال: ۲ نفر استادکار برق‌کاری ساختمان"
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    KarvinTextField(
                        value = state.description,
                        onValueChange = viewModel::onDescriptionChange,
                        label = stringResource(id = R.string.job_description_label),
                        placeholder = "شرح وظایف، ابزار مورد نیاز و جزئیات شیفت...",
                        singleLine = false,
                        maxLines = 4
                    )
                }
            }

            // Category Selection
            Text(text = stringResource(id = R.string.job_category_select), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(categoryScroll),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                state.availableCategories.forEach { cat ->
                    val isSelected = state.selectedCategory?.id == cat.id
                    KarvinFilterChip(
                        text = cat.nameFa,
                        isSelected = isSelected,
                        onClick = { viewModel.onCategorySelect(cat) }
                    )
                }
            }

            // Workers Needed & Schedule
            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    KarvinTextField(
                        value = state.numberOfWorkers,
                        onValueChange = viewModel::onNumberOfWorkersChange,
                        label = stringResource(id = R.string.job_workers_count),
                        placeholder = "مثال: ۲",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        leadingIcon = { Icon(Icons.Default.People, contentDescription = null, tint = Navy900) }
                    )

                    KarvinTextField(
                        value = state.date,
                        onValueChange = viewModel::onDateChange,
                        label = stringResource(id = R.string.job_date_label),
                        placeholder = "۱۴۰۳/۰۶/۱۰",
                        leadingIcon = { Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Navy900) }
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        KarvinTextField(
                            value = state.startTime,
                            onValueChange = viewModel::onStartTimeChange,
                            label = stringResource(id = R.string.job_start_time),
                            placeholder = "۰۸:۰۰",
                            modifier = Modifier.weight(1f),
                            leadingIcon = { Icon(Icons.Default.AccessTime, contentDescription = null, tint = Navy900) }
                        )

                        KarvinTextField(
                            value = state.endTime,
                            onValueChange = viewModel::onEndTimeChange,
                            label = stringResource(id = R.string.job_end_time),
                            placeholder = "۱۷:۰۰",
                            modifier = Modifier.weight(1f),
                            leadingIcon = { Icon(Icons.Default.AccessTime, contentDescription = null, tint = Navy900) }
                        )
                    }
                }
            }

            // Salary & Location
            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    KarvinTextField(
                        value = state.salaryToman,
                        onValueChange = viewModel::onSalaryChange,
                        label = stringResource(id = R.string.job_salary_amount),
                        placeholder = "۱,۲۰۰,۰۰۰",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        leadingIcon = { Icon(Icons.Default.AttachMoney, contentDescription = null, tint = Emerald600) }
                    )

                    KarvinTextField(
                        value = state.city,
                        onValueChange = viewModel::onCityChange,
                        label = stringResource(id = R.string.city_label),
                        placeholder = "تهران",
                        leadingIcon = { Icon(Icons.Default.LocationCity, contentDescription = null, tint = Navy900) }
                    )

                    KarvinTextField(
                        value = state.address,
                        onValueChange = viewModel::onAddressChange,
                        label = stringResource(id = R.string.address_label),
                        placeholder = "آدرس دقیق پروژه / کارگاه"
                    )
                }
            }

            // Required Skills
            Text(text = stringResource(id = R.string.required_skills_label), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                state.availableSkills.forEach { skill ->
                    val isSelected = state.selectedSkills.any { it.id == skill.id }
                    KarvinFilterChip(
                        text = skill.nameFa,
                        isSelected = isSelected,
                        onClick = { viewModel.toggleSkill(skill) }
                    )
                }
            }

            // Urgent Job Switch
            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Whatshot, contentDescription = null, tint = Red500)
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(text = "نیاز به نیروی فوری (اعلان ویژه)", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                            Text(text = "آگهی در صدر نتایج و بخش فوری قرار می‌گیرد", style = MaterialTheme.typography.bodySmall, color = TextSecondaryLight)
                        }
                    }
                    Switch(
                        checked = state.isUrgent,
                        onCheckedChange = viewModel::onUrgentToggle,
                        colors = SwitchDefaults.colors(checkedThumbColor = Red500, checkedTrackColor = Red100)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            KarvinButton(
                text = stringResource(id = R.string.submit_job_btn),
                onClick = viewModel::submitJob,
                type = KarvinButtonType.PRIMARY,
                isLoading = state.isLoading
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

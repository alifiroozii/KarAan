package com.karvin.app.presentation.employer.shifts

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.domain.model.ShiftStatus
import com.karvin.app.presentation.components.EmptyStateView
import com.karvin.app.presentation.components.KarvinFilterChip
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.components.ShiftCard

@Composable
fun EmployerShiftsScreen(
    onNavigateToNotifications: () -> Unit,
    viewModel: EmployerShiftsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    val filteredShifts = if (state.selectedFilter != null) {
        state.shifts.filter { it.status == state.selectedFilter }
    } else {
        state.shifts
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = "مدیریت شیفت‌های کاری نیروها",
                onNotificationClick = onNavigateToNotifications
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Filter Tabs
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                KarvinFilterChip(
                    text = "همه",
                    isSelected = state.selectedFilter == null,
                    onClick = { viewModel.setFilter(null) }
                )
                KarvinFilterChip(
                    text = stringResource(id = R.string.shift_upcoming),
                    isSelected = state.selectedFilter == ShiftStatus.UPCOMING,
                    onClick = { viewModel.setFilter(ShiftStatus.UPCOMING) }
                )
                KarvinFilterChip(
                    text = stringResource(id = R.string.shift_in_progress),
                    isSelected = state.selectedFilter == ShiftStatus.IN_PROGRESS,
                    onClick = { viewModel.setFilter(ShiftStatus.IN_PROGRESS) }
                )
                KarvinFilterChip(
                    text = stringResource(id = R.string.shift_completed),
                    isSelected = state.selectedFilter == ShiftStatus.COMPLETED,
                    onClick = { viewModel.setFilter(ShiftStatus.COMPLETED) }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (filteredShifts.isEmpty()) {
                EmptyStateView(
                    title = "شیفت فعالی ثبت نشده است",
                    message = "با تایید درخواست متقاضیان، شیفت‌های کاری در این بخش جهت نظارت قرار می‌گیرند."
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    items(filteredShifts) { shift ->
                        ShiftCard(
                            shift = shift,
                            onStatusActionClick = null
                        )
                    }
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }
        }
    }
}

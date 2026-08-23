package com.karvin.app.presentation.employer.applicants

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
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.domain.model.ApplicationStatus
import com.karvin.app.presentation.components.ApplicantCard
import com.karvin.app.presentation.components.EmptyStateView
import com.karvin.app.presentation.components.KarvinFilterChip
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.components.RatingDialog

@Composable
fun EmployerApplicantsScreen(
    onNavigateToNotifications: () -> Unit,
    viewModel: EmployerApplicantsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    if (state.selectedApplicantForRating != null) {
        RatingDialog(
            workerName = state.selectedApplicantForRating?.workerName ?: "نیرو",
            onDismiss = viewModel::dismissRatingDialog,
            onSubmit = viewModel::submitRating
        )
    }

    val filteredApplicants = if (state.selectedStatusFilter != null) {
        state.applicants.filter { it.status == state.selectedStatusFilter }
    } else {
        state.applicants
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.applicants_title),
                onNotificationClick = onNavigateToNotifications
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
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
                    text = stringResource(id = R.string.tab_all),
                    isSelected = state.selectedStatusFilter == null,
                    onClick = { viewModel.setFilter(null) }
                )
                KarvinFilterChip(
                    text = stringResource(id = R.string.tab_pending),
                    isSelected = state.selectedStatusFilter == ApplicationStatus.PENDING,
                    onClick = { viewModel.setFilter(ApplicationStatus.PENDING) }
                )
                KarvinFilterChip(
                    text = stringResource(id = R.string.tab_accepted),
                    isSelected = state.selectedStatusFilter == ApplicationStatus.ACCEPTED,
                    onClick = { viewModel.setFilter(ApplicationStatus.ACCEPTED) }
                )
                KarvinFilterChip(
                    text = stringResource(id = R.string.tab_rejected),
                    isSelected = state.selectedStatusFilter == ApplicationStatus.REJECTED,
                    onClick = { viewModel.setFilter(ApplicationStatus.REJECTED) }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (filteredApplicants.isEmpty()) {
                EmptyStateView(
                    title = "درخواستی یافت نشد",
                    message = "درخواست‌های ارسال شده توسط متقاضیان در این قسمت نمایش داده می‌شوند."
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    items(filteredApplicants) { applicant ->
                        ApplicantCard(
                            application = applicant,
                            onAcceptClick = { viewModel.acceptApplicant(applicant) },
                            onRejectClick = { viewModel.rejectApplicant(applicant) },
                            onRateClick = { viewModel.openRatingDialog(applicant) }
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

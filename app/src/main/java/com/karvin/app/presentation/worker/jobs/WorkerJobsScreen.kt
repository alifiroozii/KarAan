package com.karvin.app.presentation.worker.jobs

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
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
import com.karvin.app.presentation.components.EmptyStateView
import com.karvin.app.presentation.components.JobCard
import com.karvin.app.presentation.components.KarvinFilterChip
import com.karvin.app.presentation.components.KarvinTextField
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Navy900

@Composable
fun WorkerJobsScreen(
    onNavigateToJobDetails: (String) -> Unit,
    onNavigateToNotifications: () -> Unit,
    viewModel: WorkerJobsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val categoriesScroll = rememberScrollState()

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.nav_jobs),
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
            Spacer(modifier = Modifier.height(10.dp))

            // Search Bar
            KarvinTextField(
                value = state.searchQuery,
                onValueChange = viewModel::onSearchQueryChange,
                label = "",
                placeholder = "جستجوی شغل، مهارت یا عنوان کاری...",
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = null,
                        tint = Navy900
                    )
                }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Category Filter Chips Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(categoriesScroll),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                KarvinFilterChip(
                    text = "همه دسته‌ها",
                    isSelected = state.selectedCategoryId == null,
                    onClick = { viewModel.onCategorySelect(null) }
                )
                state.categories.forEach { cat ->
                    KarvinFilterChip(
                        text = cat.nameFa,
                        isSelected = state.selectedCategoryId == cat.id,
                        onClick = { viewModel.onCategorySelect(cat.id) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Jobs List
            if (state.jobs.isEmpty()) {
                EmptyStateView(
                    title = "فرصت کاری یافت نشد",
                    message = "با تغییر فیلترها یا عبارت جستجو مجدداً تلاش کنید."
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    items(state.jobs) { job ->
                        JobCard(
                            job = job,
                            onClick = { onNavigateToJobDetails(job.id) },
                            onApplyClick = { viewModel.applyForJob(job.id) }
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

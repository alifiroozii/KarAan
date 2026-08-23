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
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Sort
import androidx.compose.material.icons.filled.WorkOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.presentation.components.EmptyStateView
import com.karvin.app.presentation.components.JobCard
import com.karvin.app.presentation.components.KarvinFilterChip
import com.karvin.app.presentation.components.KarvinTextField
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight

@Composable
fun WorkerJobsScreen(
    onNavigateToJobDetails: (String) -> Unit,
    onNavigateToNotifications: () -> Unit,
    viewModel: WorkerJobsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val categoriesScroll = rememberScrollState()
    val sortScroll = rememberScrollState()

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = "فرصت‌های شغلی بازار کار",
                actions = {
                    IconButton(onClick = onNavigateToNotifications) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Notifications",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
        ) {
            // Top Tab Row: All, Saved, Applied, Accepted, Completed
            ScrollableTabRow(
                selectedTabIndex = state.selectedTab.ordinal,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = Navy900,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[state.selectedTab.ordinal]),
                        color = Emerald600
                    )
                },
                edgePadding = 16.dp
            ) {
                JobTabOption.values().forEach { tab ->
                    Tab(
                        selected = state.selectedTab == tab,
                        onClick = { viewModel.onTabSelect(tab) },
                        text = {
                            Text(
                                text = tab.titleFa,
                                fontWeight = if (state.selectedTab == tab) FontWeight.Bold else FontWeight.Normal,
                                color = if (state.selectedTab == tab) Navy900 else TextSecondaryLight
                            )
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                // Search Bar
                KarvinTextField(
                    value = state.searchQuery,
                    onValueChange = viewModel::onSearchQueryChange,
                    placeholder = "جستجوی عنوان شغلی، مهارت، کارفرما یا محله...",
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Search",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Categories Filter Chips
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
                    state.categories.forEach { category ->
                        KarvinFilterChip(
                            text = category.nameFa,
                            isSelected = state.selectedCategoryId == category.id,
                            onClick = { viewModel.onCategorySelect(category.id) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Sort Options Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(sortScroll),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Sort,
                        contentDescription = "Sort",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(end = 4.dp)
                    )
                    JobSortOption.values().forEach { option ->
                        KarvinFilterChip(
                            text = option.titleFa,
                            isSelected = state.selectedSort == option,
                            onClick = { viewModel.onSortSelect(option) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Jobs List
                if (state.displayJobs.isEmpty()) {
                    EmptyStateView(
                        title = "فرصت شغلی در این بخش یافت نشد",
                        message = "فیلترهای انتخابی را تغییر دهید یا به برگه «همه فرصت‌ها» بازگردید.",
                        icon = Icons.Default.WorkOutline
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(state.displayJobs) { job ->
                            JobCard(
                                job = job,
                                onClick = { onNavigateToJobDetails(job.id) },
                                onApplyClick = {
                                    if (job.hasApplied) {
                                        viewModel.cancelApplication(job.id)
                                    } else {
                                        viewModel.applyForJob(job.id)
                                    }
                                }
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
}

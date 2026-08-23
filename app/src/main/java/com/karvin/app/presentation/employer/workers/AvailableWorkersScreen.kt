package com.karvin.app.presentation.employer.workers

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Sort
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.domain.model.TrustBadge
import com.karvin.app.domain.model.WorkerProfile
import com.karvin.app.presentation.components.EmptyStateView
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.KarvinFilterChip
import com.karvin.app.presentation.components.KarvinSkillBadge
import com.karvin.app.presentation.components.KarvinTextField
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.components.TrustBadgeRow
import com.karvin.app.presentation.employer.invitations.SendInvitationDialog
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Blue100
import com.karvin.app.presentation.theme.Blue500
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter

@Composable
fun AvailableWorkersScreen(
    onNavigateToWorkerProfile: (String) -> Unit,
    viewModel: AvailableWorkersViewModel = hiltViewModel()
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

    if (state.selectedWorkerForInvite != null) {
        SendInvitationDialog(
            worker = state.selectedWorkerForInvite!!,
            onDismiss = viewModel::closeInviteDialog,
            onSendInvitation = viewModel::sendInvitation
        )
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = "نیروهای آماده به کار (بازار کار)"
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
            Spacer(modifier = Modifier.height(8.dp))

            // Search Bar
            KarvinTextField(
                value = state.searchQuery,
                onValueChange = viewModel::onSearchQueryChange,
                placeholder = "جستجوی نام نیرو، تخصص یا محله...",
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Categories Filter Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(categoriesScroll),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                KarvinFilterChip(
                    text = "همه تخصص‌ها",
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

            // Sort Options
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
                WorkerSortOption.values().forEach { option ->
                    KarvinFilterChip(
                        text = option.titleFa,
                        isSelected = state.selectedSort == option,
                        onClick = { viewModel.onSortSelect(option) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Workers List
            if (state.filteredWorkers.isEmpty()) {
                EmptyStateView(
                    title = "نیرویی با این مشخصات یافت نشد",
                    message = "فیلترهای جستجو را تغییر دهید یا فیلتر دسته‌بندی را پاک کنید.",
                    icon = Icons.Default.Person
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.filteredWorkers) { worker ->
                        MarketplaceWorkerCard(
                            worker = worker,
                            onViewProfileClick = { onNavigateToWorkerProfile(worker.userId) },
                            onInviteClick = { viewModel.openInviteDialog(worker) }
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

@Composable
fun MarketplaceWorkerCard(
    worker: WorkerProfile,
    onViewProfileClick: () -> Unit,
    onInviteClick: () -> Unit
) {
    KarvinCard(
        modifier = Modifier.fillMaxWidth(),
        shapeRadius = 16.dp,
        onClick = onViewProfileClick
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header: Avatar, Name, Specialty, Availability dot, Distance badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .clip(CircleShape)
                            .background(Navy900),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(30.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = worker.fullName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.Verified, contentDescription = "Verified", tint = Emerald600, modifier = Modifier.size(16.dp))
                        }

                        Text(
                            text = worker.primarySkill,
                            style = MaterialTheme.typography.bodySmall,
                            color = Navy900,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    // Availability status badge
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (worker.isAvailableNow) Emerald100 else Color.LightGray.copy(alpha = 0.3f))
                            .padding(horizontal = 7.dp, vertical = 3.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(if (worker.isAvailableNow) Emerald600 else Color.Gray)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (worker.isAvailableNow) "آماده کار" else "غیرفعال",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = if (worker.isAvailableNow) Emerald600 else Color.DarkGray
                            )
                        }
                    }

                    if (worker.distanceTextFa != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.NearMe, contentDescription = null, tint = Blue500, modifier = Modifier.size(11.dp))
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(
                                text = worker.distanceTextFa ?: "",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = Blue500
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Rating, Experience and Completed Jobs
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = Amber500, modifier = Modifier.size(15.dp))
                    Spacer(modifier = Modifier.width(2.dp))
                    Text(
                        text = PersianDateFormatter.toPersianDigits(worker.rating),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${PersianDateFormatter.toPersianDigits(worker.experienceYears)} سال سابقه",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondaryLight
                    )
                }

                Text(
                    text = "${PersianDateFormatter.toPersianDigits(worker.completedJobsCount)} کار موفق",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Bold,
                    color = Emerald600
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Trust Badges
            TrustBadgeRow(
                badges = listOf(
                    TrustBadge.BADGE_IDENTITY,
                    TrustBadge.BADGE_PUNCTUAL
                )
            )

            // Skills Badges
            if (worker.skills.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    worker.skills.take(3).forEach { skill ->
                        KarvinSkillBadge(text = skill.nameFa, isHighlighted = true)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Actions: [مشاهده پروفایل] [دعوت به کار]
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                KarvinButton(
                    text = "مشاهده پروفایل",
                    onClick = onViewProfileClick,
                    type = KarvinButtonType.OUTLINED,
                    modifier = Modifier.weight(1f),
                    height = 38.dp,
                    shapeRadius = 10.dp
                )
                KarvinButton(
                    text = "دعوت به کار",
                    onClick = onInviteClick,
                    type = KarvinButtonType.SECONDARY,
                    icon = Icons.Default.Send,
                    modifier = Modifier.weight(1.2f),
                    height = 38.dp,
                    shapeRadius = 10.dp
                )
            }
        }
    }
}

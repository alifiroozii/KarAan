package com.karvin.app.core.designsystem

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.karvin.app.core.navigation.Routes
import com.karvin.app.domain.model.UserRole

@Composable
fun KarvinScaffold(
    navController: NavHostController,
    role: UserRole,
    content: @Composable (PaddingValues) -> Unit,
    floatingActionButton: (@Composable () -> Unit)? = null,
) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        floatingActionButton = { floatingActionButton?.invoke() },
        bottomBar = {
            GoogleStitchBottomBar(
                navController = navController,
                currentRoute = currentRoute,
                role = role,
            )
        },
        content = content,
    )
}

@Composable
fun KarvinHomeScaffold(
    navController: NavHostController,
    providerMode: Boolean,
    floatingActionButton: (@Composable () -> Unit)? = null,
    content: @Composable (PaddingValues) -> Unit,
) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val role = if (providerMode) UserRole.PROVIDER else UserRole.REQUESTER

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        floatingActionButton = { floatingActionButton?.invoke() },
        bottomBar = {
            GoogleStitchBottomBar(
                navController = navController,
                currentRoute = currentRoute,
                role = role,
            )
        },
        content = content,
    )
}

@Composable
fun GoogleStitchBottomBar(
    navController: NavHostController,
    currentRoute: String?,
    role: UserRole,
) {
    val homeRoute = if (role == UserRole.PROVIDER) Routes.ProviderHome else Routes.RequesterHome
    val mapRoute = if (role == UserRole.PROVIDER) Routes.ProviderMap else Routes.RequesterMap
    val jobsRoute = if (role == UserRole.PROVIDER) Routes.ProviderJobs else Routes.RequesterJobs

    val onNavigate: (String) -> Unit = { targetRoute ->
        if (currentRoute != targetRoute) {
            navController.navigate(targetRoute) {
                popUpTo(homeRoute) {
                    saveState = true
                    inclusive = false
                }
                launchSingleTop = true
                restoreState = true
            }
        }
    }

    Surface(
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 12.dp,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.40f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 4.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            // Tab 1: کاوش
            val isExploreSelected = currentRoute == mapRoute || currentRoute == homeRoute
            StitchNavItem(
                title = "کاوش",
                icon = Icons.Default.Explore,
                selected = isExploreSelected,
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(mapRoute) }
            )

            // Tab 2: درخواست‌ها
            val isJobsSelected = currentRoute == jobsRoute
            StitchNavItem(
                title = "درخواست‌ها",
                icon = Icons.Default.Assignment,
                selected = isJobsSelected,
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(jobsRoute) }
            )

            // Central Elevated Action Button (ثبت کار)
            Column(
                modifier = Modifier
                    .weight(1f)
                    .offset(y = (-12).dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primary,
                    border = BorderStroke(3.dp, MaterialTheme.colorScheme.surface),
                    shadowElevation = 6.dp,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .clickable { onNavigate(Routes.CreateJob) },
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.linearGradient(
                                    listOf(Color(0xFF2563EB), Color(0xFF1D4ED8))
                                )
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            Icons.Default.Add,
                            contentDescription = "ثبت کار",
                            tint = Color.White,
                            modifier = Modifier.size(26.dp)
                        )
                    }
                }
                Spacer(Modifier.height(3.dp))
                Text(
                    text = "ثبت کار",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
            }

            // Tab 3: پیام‌ها
            val isChatSelected = currentRoute == Routes.Chat
            StitchNavItem(
                title = "پیام‌ها",
                icon = Icons.Outlined.ChatBubbleOutline,
                selected = isChatSelected,
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(Routes.Chat) }
            )

            // Tab 4: حساب من
            val isProfileSelected = currentRoute == Routes.Profile
            StitchNavItem(
                title = "حساب من",
                icon = Icons.Default.Person,
                selected = isProfileSelected,
                modifier = Modifier.weight(1f),
                onClick = { onNavigate(Routes.Profile) }
            )
        }
    }
}

@Composable
private fun StitchNavItem(
    title: String,
    icon: ImageVector,
    selected: Boolean,
    modifier: Modifier = Modifier,
    hasBadge: Boolean = false,
    onClick: () -> Unit,
) {
    val activeColor = MaterialTheme.colorScheme.primary
    val inactiveColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f)
    val color = if (selected) activeColor else inactiveColor

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 2.dp, vertical = 2.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.12f) else Color.Transparent,
        ) {
            Box(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    icon,
                    contentDescription = title,
                    tint = color,
                    modifier = Modifier.size(22.dp)
                )
                if (hasBadge) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFEF4444))
                            .align(Alignment.TopEnd)
                    )
                }
            }
        }
        Spacer(Modifier.height(2.dp))
        Text(
            text = title,
            fontSize = 11.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            color = color,
            maxLines = 1,
        )
    }
}

@Composable
fun KarvinFab(label: String, onClick: () -> Unit) {
    FloatingActionButton(
        onClick = onClick,
        modifier = Modifier.semantics { contentDescription = label },
        containerColor = MaterialTheme.colorScheme.primary,
        contentColor = MaterialTheme.colorScheme.onPrimary,
        shape = RoundedCornerShape(18.dp),
    ) {
        Icon(Icons.Default.Add, contentDescription = label)
    }
}

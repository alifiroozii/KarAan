package com.karvin.app.presentation.worker

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.karvin.app.domain.model.UserRole
import com.karvin.app.presentation.chat.ChatListScreen
import com.karvin.app.presentation.map.MapScreen
import com.karvin.app.presentation.navigation.BottomNavItem
import com.karvin.app.presentation.navigation.Screen
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.worker.home.WorkerHomeScreen
import com.karvin.app.presentation.worker.jobs.WorkerJobsScreen
import com.karvin.app.presentation.worker.profile.WorkerProfileScreen
import com.karvin.app.presentation.worker.shifts.WorkerShiftsScreen

@Composable
fun WorkerMainContainer(
    onNavigateToJobDetails: (String) -> Unit,
    onNavigateToChatDetail: (String) -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToEditProfile: () -> Unit,
    onLogout: () -> Unit
) {
    val bottomNavController = rememberNavController()

    val navItems = listOf(
        BottomNavItem.WorkerHome,
        BottomNavItem.WorkerMap,
        BottomNavItem.WorkerJobs,
        BottomNavItem.WorkerChat,
        BottomNavItem.WorkerProfile
    )

    val navBackStackEntry by bottomNavController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.onSurface
            ) {
                navItems.forEach { item ->
                    val isSelected = currentDestination?.hierarchy?.any { it.route == item.route } == true
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = {
                            bottomNavController.navigate(item.route) {
                                popUpTo(bottomNavController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = stringResource(id = item.titleRes)
                            )
                        },
                        label = {
                            Text(
                                text = stringResource(id = item.titleRes),
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Navy900,
                            selectedTextColor = Navy900,
                            indicatorColor = Emerald600.copy(alpha = 0.15f)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = bottomNavController,
            startDestination = Screen.WorkerHome.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.WorkerHome.route) {
                WorkerHomeScreen(
                    onNavigateToJobs = { bottomNavController.navigate(Screen.WorkerJobs.route) },
                    onNavigateToApplications = { bottomNavController.navigate(Screen.WorkerShifts.route) },
                    onNavigateToShifts = { bottomNavController.navigate(Screen.WorkerShifts.route) },
                    onNavigateToJobDetails = onNavigateToJobDetails,
                    onNavigateToNotifications = onNavigateToNotifications
                )
            }
            composable(Screen.WorkerMap.route) {
                MapScreen(
                    userRole = UserRole.WORKER,
                    onNavigateToJobDetails = onNavigateToJobDetails,
                    onNavigateToChat = onNavigateToChatDetail
                )
            }
            composable(Screen.WorkerJobs.route) {
                WorkerJobsScreen(
                    onNavigateToJobDetails = onNavigateToJobDetails,
                    onNavigateToNotifications = onNavigateToNotifications
                )
            }
            composable(Screen.WorkerShifts.route) {
                WorkerShiftsScreen(
                    onNavigateToNotifications = onNavigateToNotifications
                )
            }
            composable(Screen.WorkerChat.route) {
                ChatListScreen(
                    onNavigateToChatDetail = onNavigateToChatDetail
                )
            }
            composable(Screen.WorkerProfile.route) {
                WorkerProfileScreen(
                    onNavigateToSettings = onNavigateToSettings,
                    onNavigateToEditProfile = onNavigateToEditProfile,
                    onLogout = onLogout
                )
            }
        }
    }
}

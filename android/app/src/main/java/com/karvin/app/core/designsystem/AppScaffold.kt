package com.karvin.app.core.designsystem

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.WorkOutline
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.karvin.app.core.navigation.BottomDestination
import com.karvin.app.core.navigation.Routes
import com.karvin.app.core.navigation.providerHomeDestinations
import com.karvin.app.core.navigation.requesterBottomDestinations
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
    val destinations = if (role == UserRole.PROVIDER) providerHomeDestinations() else requesterBottomDestinations()
    Scaffold(
        modifier = Modifier.fillMaxSize(),
        floatingActionButton = { floatingActionButton?.invoke() },
        bottomBar = {
            Surface(
                shadowElevation = 8.dp,
                color = MaterialTheme.colorScheme.surface,
            ) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 0.dp,
                ) {
                    destinations.forEach { destination ->
                        val selected = currentRoute == destination.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(destination.route) {
                                    popUpTo(if (role == UserRole.PROVIDER) Routes.ProviderHome else Routes.RequesterHome) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { DestinationIcon(destination) },
                            label = {
                                Text(
                                    destination.title,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            ),
                            modifier = Modifier.semantics { contentDescription = destination.title },
                        )
                    }
                }
            }
        },
        content = content,
    )
}

@Composable
private fun DestinationIcon(destination: BottomDestination) {
    val icon = when (destination.route) {
        Routes.ProviderHome, Routes.RequesterHome -> Icons.Default.Home
        Routes.ProviderJobs, Routes.RequesterJobs -> if (destination.route == Routes.ProviderJobs) Icons.Default.WorkOutline else Icons.Default.Business
        Routes.ProviderMap, Routes.RequesterMap -> Icons.Default.Map
        Routes.Chat -> Icons.Default.ChatBubbleOutline
        Routes.Profile -> Icons.Default.Person
        else -> Icons.Default.MoreHoriz
    }
    Icon(icon, contentDescription = destination.title)
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

@Composable
fun KarvinHomeScaffold(
    navController: NavHostController,
    providerMode: Boolean,
    content: @Composable (PaddingValues) -> Unit,
) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val destinations = if (providerMode) providerHomeDestinations() else requesterBottomDestinations()
    val homeRoute = if (providerMode) Routes.ProviderHome else Routes.RequesterHome

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            Surface(
                shadowElevation = 8.dp,
                color = MaterialTheme.colorScheme.surface,
            ) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 0.dp,
                ) {
                    destinations.forEach { destination ->
                        val selected = currentRoute == destination.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(destination.route) {
                                    popUpTo(homeRoute) {
                                        saveState = true
                                        inclusive = false
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { DestinationIcon(destination) },
                            label = {
                                Text(
                                    destination.title,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            ),
                            modifier = Modifier.semantics { contentDescription = destination.title },
                        )
                    }
                }
            }
        },
        content = content,
    )
}

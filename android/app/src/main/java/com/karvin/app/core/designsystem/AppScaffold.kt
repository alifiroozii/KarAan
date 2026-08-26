package com.karvin.app.core.designsystem

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.WorkOutline
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.karvin.app.core.navigation.BottomDestination
import com.karvin.app.core.navigation.Routes
import com.karvin.app.core.navigation.bottomDestinations
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
            NavigationBar {
                bottomDestinations(role).forEach { destination ->
                    NavigationBarItem(
                        selected = currentRoute == destination.route,
                        onClick = {
                            navController.navigate(destination.route) {
                                popUpTo(if (role == UserRole.WORKER) Routes.WorkerHome else Routes.EmployerHome) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { DestinationIcon(destination) },
                        label = { Text(destination.title) },
                        modifier = Modifier.semantics { contentDescription = destination.title },
                    )
                }
            }
        },
        content = content,
    )
}

@Composable
private fun DestinationIcon(destination: BottomDestination) {
    val icon = when (destination.route) {
        Routes.WorkerHome, Routes.EmployerHome -> Icons.Default.Home
        Routes.WorkerJobs, Routes.EmployerJobs -> if (destination.route == Routes.EmployerJobs) Icons.Default.Business else Icons.Default.WorkOutline
        Routes.WorkerMap, Routes.EmployerMap -> Icons.Default.Map
        Routes.Chat -> Icons.Default.ChatBubbleOutline
        Routes.Profile -> Icons.Default.Person
        else -> Icons.Default.Home
    }
    Icon(icon, contentDescription = destination.title)
}

@Composable
fun KarvinFab(label: String, onClick: () -> Unit) {
    FloatingActionButton(onClick = onClick, modifier = Modifier.semantics { contentDescription = label }) {
        Text("+")
    }
}

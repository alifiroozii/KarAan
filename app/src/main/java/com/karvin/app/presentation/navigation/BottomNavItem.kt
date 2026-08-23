package com.karvin.app.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Work
import androidx.compose.ui.graphics.vector.ImageVector

sealed class BottomNavItem(
    val route: String,
    val titleRes: Int,
    val icon: ImageVector
) {
    // Worker 5 Nav Items
    object WorkerHome : BottomNavItem("worker_home", com.karvin.app.R.string.nav_home, Icons.Default.Home)
    object WorkerMap : BottomNavItem("worker_map", com.karvin.app.R.string.nav_map, Icons.Default.Map)
    object WorkerJobs : BottomNavItem("worker_jobs", com.karvin.app.R.string.nav_jobs, Icons.Default.Work)
    object WorkerChat : BottomNavItem("worker_chat", com.karvin.app.R.string.nav_messages, Icons.Default.ChatBubbleOutline)
    object WorkerProfile : BottomNavItem("worker_profile", com.karvin.app.R.string.nav_profile, Icons.Default.Person)

    // Employer 5 Nav Items
    object EmployerDashboard : BottomNavItem("employer_dashboard", com.karvin.app.R.string.nav_home, Icons.Default.Dashboard)
    object EmployerMap : BottomNavItem("employer_map", com.karvin.app.R.string.nav_map, Icons.Default.Map)
    object EmployerApplicants : BottomNavItem("employer_applicants", com.karvin.app.R.string.nav_workers, Icons.Default.People)
    object EmployerChat : BottomNavItem("employer_chat", com.karvin.app.R.string.nav_messages, Icons.Default.ChatBubbleOutline)
    object EmployerProfile : BottomNavItem("employer_profile", com.karvin.app.R.string.nav_profile, Icons.Default.Person)
}

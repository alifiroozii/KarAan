package com.karvin.app.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Work
import androidx.compose.ui.graphics.vector.ImageVector

sealed class BottomNavItem(
    val route: String,
    val titleRes: Int,
    val icon: ImageVector
) {
    // Worker Nav Items
    object WorkerHome : BottomNavItem("worker_home", com.karvin.app.R.string.nav_home, Icons.Default.Home)
    object WorkerJobs : BottomNavItem("worker_jobs", com.karvin.app.R.string.nav_jobs, Icons.Default.Work)
    object WorkerShifts : BottomNavItem("worker_shifts", com.karvin.app.R.string.nav_shifts, Icons.Default.DateRange)
    object WorkerProfile : BottomNavItem("worker_profile", com.karvin.app.R.string.nav_profile, Icons.Default.Person)

    // Employer Nav Items
    object EmployerDashboard : BottomNavItem("employer_dashboard", com.karvin.app.R.string.nav_home, Icons.Default.Dashboard)
    object CreateJob : BottomNavItem("create_job", com.karvin.app.R.string.nav_create_job, Icons.Default.AddCircle)
    object EmployerApplicants : BottomNavItem("employer_applicants", com.karvin.app.R.string.nav_applicants, Icons.Default.People)
    object EmployerShifts : BottomNavItem("employer_shifts", com.karvin.app.R.string.nav_shifts, Icons.Default.Assignment)
    object EmployerProfile : BottomNavItem("employer_profile", com.karvin.app.R.string.nav_profile, Icons.Default.Person)
}

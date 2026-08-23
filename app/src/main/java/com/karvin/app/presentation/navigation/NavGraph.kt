package com.karvin.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.karvin.app.domain.model.UserRole
import com.karvin.app.presentation.auth.employer_register.EmployerRegisterScreen
import com.karvin.app.presentation.auth.login.LoginScreen
import com.karvin.app.presentation.auth.login.OtpVerificationScreen
import com.karvin.app.presentation.auth.worker_register.WorkerRegisterScreen
import com.karvin.app.presentation.common.EditProfileScreen
import com.karvin.app.presentation.common.SettingsScreen
import com.karvin.app.presentation.employer.EmployerMainContainer
import com.karvin.app.presentation.notifications.NotificationScreen
import com.karvin.app.presentation.role_selection.RoleSelectionScreen
import com.karvin.app.presentation.splash.SplashScreen
import com.karvin.app.presentation.worker.WorkerMainContainer
import com.karvin.app.presentation.worker.jobs.JobDetailsScreen

@Composable
fun KarvinNavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Splash.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // Splash
        composable(Screen.Splash.route) {
            SplashScreen(
                onNavigateToRoleSelection = {
                    navController.navigate(Screen.RoleSelection.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToWorkerHome = {
                    navController.navigate(Screen.WorkerMain.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToEmployerDashboard = {
                    navController.navigate(Screen.EmployerMain.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }

        // Role Selection
        composable(Screen.RoleSelection.route) {
            RoleSelectionScreen(
                onSelectRole = { role ->
                    navController.navigate(Screen.Login.createRoute(role.name))
                }
            )
        }

        // Login
        composable(
            route = Screen.Login.route,
            arguments = listOf(
                navArgument("role") {
                    type = NavType.StringType
                    defaultValue = UserRole.WORKER.name
                }
            )
        ) {
            LoginScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToOtp = { phone, role ->
                    navController.navigate(Screen.OtpVerification.createRoute(phone, role))
                },
                onNavigateToRegister = { role ->
                    if (role == UserRole.WORKER) {
                        navController.navigate(Screen.WorkerRegister.route)
                    } else {
                        navController.navigate(Screen.EmployerRegister.route)
                    }
                }
            )
        }

        // OTP Verification
        composable(
            route = Screen.OtpVerification.route,
            arguments = listOf(
                navArgument("phone") {
                    type = NavType.StringType
                    defaultValue = "09123456789"
                },
                navArgument("role") {
                    type = NavType.StringType
                    defaultValue = UserRole.WORKER.name
                }
            )
        ) { backStackEntry ->
            val phone = backStackEntry.arguments?.getString("phone") ?: "09123456789"
            val role = backStackEntry.arguments?.getString("role") ?: UserRole.WORKER.name
            OtpVerificationScreen(
                phoneNumber = phone,
                role = role,
                onNavigateBack = { navController.popBackStack() },
                onLoginSuccess = { userRole ->
                    val destination = if (userRole == UserRole.WORKER) Screen.WorkerMain.route else Screen.EmployerMain.route
                    navController.navigate(destination) {
                        popUpTo(Screen.RoleSelection.route) { inclusive = true }
                    }
                }
            )
        }

        // Worker Registration (Multi-step)
        composable(Screen.WorkerRegister.route) {
            WorkerRegisterScreen(
                onNavigateBack = { navController.popBackStack() },
                onRegisterSuccess = {
                    navController.navigate(Screen.WorkerMain.route) {
                        popUpTo(Screen.RoleSelection.route) { inclusive = true }
                    }
                }
            )
        }

        // Employer Registration
        composable(Screen.EmployerRegister.route) {
            EmployerRegisterScreen(
                onNavigateBack = { navController.popBackStack() },
                onRegisterSuccess = {
                    navController.navigate(Screen.EmployerMain.route) {
                        popUpTo(Screen.RoleSelection.route) { inclusive = true }
                    }
                }
            )
        }

        // Worker Main (Hosting Home, Jobs, Shifts, Profile)
        composable(Screen.WorkerMain.route) {
            WorkerMainContainer(
                onNavigateToJobDetails = { jobId ->
                    navController.navigate(Screen.JobDetails.createRoute(jobId))
                },
                onNavigateToNotifications = {
                    navController.navigate(Screen.Notifications.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onNavigateToEditProfile = {
                    navController.navigate(Screen.EditProfile.route)
                },
                onLogout = {
                    navController.navigate(Screen.RoleSelection.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // Employer Main (Hosting Dashboard, Create Job, Applicants, Shifts, Profile)
        composable(Screen.EmployerMain.route) {
            EmployerMainContainer(
                onNavigateToJobDetails = { jobId ->
                    navController.navigate(Screen.JobDetails.createRoute(jobId))
                },
                onNavigateToNotifications = {
                    navController.navigate(Screen.Notifications.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onNavigateToEditProfile = {
                    navController.navigate(Screen.EditProfile.route)
                },
                onLogout = {
                    navController.navigate(Screen.RoleSelection.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // Job Details
        composable(
            route = Screen.JobDetails.route,
            arguments = listOf(
                navArgument("jobId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId") ?: ""
            JobDetailsScreen(
                jobId = jobId,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Notifications
        composable(Screen.Notifications.route) {
            NotificationScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Settings
        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Edit Profile
        composable(Screen.EditProfile.route) {
            EditProfileScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

package com.karvin.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.hilt.navigation.compose.hiltViewModel
import dagger.hilt.android.AndroidEntryPoint
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.karvin.app.core.designsystem.KarvinTheme
import com.karvin.app.core.navigation.Routes
import com.karvin.app.domain.model.UserRole
import com.karvin.app.feature.auth.AuthUiState
import com.karvin.app.feature.auth.AuthViewModel
import com.karvin.app.feature.auth.AuthEvent
import com.karvin.app.feature.chat.ChatListScreen
import com.karvin.app.feature.chat.ConversationScreen
import com.karvin.app.feature.home.EmployerHomeScreen
import com.karvin.app.feature.home.WorkerHomeScreen
import com.karvin.app.feature.jobs.CreateJobScreen
import com.karvin.app.feature.jobs.JobApplicationsScreen
import com.karvin.app.feature.jobs.JobDetailsScreen
import com.karvin.app.feature.jobs.JobsScreen
import com.karvin.app.feature.jobs.MyApplicationsScreen
import com.karvin.app.feature.map.MapScreen
import com.karvin.app.feature.map.RequestSentScreen
import com.karvin.app.feature.map.WorkersMapScreen
import com.karvin.app.feature.map.WorkAreaScreen
import com.karvin.app.feature.notifications.NotificationsScreen
import com.karvin.app.feature.onboarding.AuthScreen
import com.karvin.app.feature.onboarding.OnboardingScreen
import com.karvin.app.feature.onboarding.RoleScreen
import com.karvin.app.feature.onboarding.SplashScreen
import com.karvin.app.feature.profile.ProfileScreen
import com.karvin.app.feature.profile.ProfileViewModel
import com.karvin.app.feature.profile.SettingsScreen
import com.karvin.app.feature.workers.RatingScreen
import com.karvin.app.feature.workers.WorkerProfileScreen

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { KarvinApp() }
    }
}

@Composable
fun KarvinApp(
    authViewModel: AuthViewModel = hiltViewModel(),
    profileViewModel: ProfileViewModel = hiltViewModel(),
) {
    val authState by authViewModel.state.collectAsStateWithLifecycle()
    val profileState by profileViewModel.state.collectAsStateWithLifecycle()
    val navController = rememberNavController()
    val startDestination = when (val state = authState) {
        AuthUiState.Loading -> Routes.Splash
        is AuthUiState.Ready -> when {
            !state.onboardingCompleted -> Routes.Onboarding
            !state.authenticated -> Routes.Auth
            state.role == null -> Routes.Role
            state.role == UserRole.WORKER -> Routes.WorkerHome
            else -> Routes.EmployerHome
        }
        is AuthUiState.Error -> Routes.Auth
    }
    KarvinTheme(
        darkTheme = when (profileState.themeMode) {
            "dark" -> true
            "light" -> false
            else -> androidx.compose.foundation.isSystemInDarkTheme()
        },
    ) {
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
            KarvinNavHost(navController, authViewModel, startDestination, (authState as? AuthUiState.Ready)?.role)
        }
    }
}

@Composable
private fun KarvinNavHost(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    startDestination: String,
    role: UserRole?,
) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    LaunchedEffect(startDestination, currentRoute) {
        if (currentRoute != null && shouldRedirectFromState(currentRoute, startDestination)) {
            navController.navigate(startDestination) {
                popUpTo(currentRoute) { inclusive = true }
                launchSingleTop = true
            }
        }
    }
    NavHost(navController = navController, startDestination = Routes.Splash) {
        composable(Routes.Splash) { SplashScreen { navController.navigate(Routes.Onboarding) { popUpTo(Routes.Splash) { inclusive = true } } } }
        composable(Routes.Onboarding) { OnboardingScreen { authViewModel.onEvent(AuthEvent.CompleteOnboarding); navController.navigate(Routes.Auth) { popUpTo(Routes.Onboarding) { inclusive = true } } } }
        composable(Routes.Auth) { AuthScreen(onSubmit = { phone -> authViewModel.onEvent(AuthEvent.SignIn(phone)); navController.navigate(Routes.Role) { popUpTo(Routes.Auth) { inclusive = true } } }) }
        composable(Routes.Role) { RoleScreen(onRoleSelected = { role -> authViewModel.onEvent(AuthEvent.SelectRole(role)); navController.navigate(if (role == UserRole.WORKER) Routes.WorkerHome else Routes.EmployerHome) { popUpTo(Routes.Role) { inclusive = true } } }) }

        composable(Routes.WorkerHome) { WorkerHomeScreen(navController) }
        composable(Routes.EmployerHome) { EmployerHomeScreen(navController) }
        composable(Routes.WorkerJobs) { JobsScreen(navController, employerMode = false) }
        composable(Routes.WorkerApplications) { MyApplicationsScreen(navController) }
        composable(Routes.EmployerJobs) { JobsScreen(navController, employerMode = true) }
        composable(Routes.WorkerMap) { MapScreen(navController, workerMode = true) }
        composable(Routes.EmployerMap) { WorkersMapScreen(navController) }
        composable(Routes.RequestSent, arguments = listOf(navArgument("provider") { type = NavType.BoolType; defaultValue = false })) { entry -> RequestSentScreen(navController, providerMode = entry.arguments?.getBoolean("provider") ?: false) }
        composable(Routes.Chat) { ChatListScreen(navController, role = role ?: UserRole.WORKER) }
        composable(Routes.Profile) { ProfileScreen(navController) }
        composable(Routes.Notifications) { NotificationsScreen(navController) }
        composable(Routes.Settings) { SettingsScreen(navController) }
        composable(Routes.WorkArea) { WorkAreaScreen(navController) }
        composable(
            Routes.CreateJobDestination,
            arguments = listOf(navArgument("workerId") { type = NavType.StringType; defaultValue = "" }),
        ) { entry -> CreateJobScreen(navController, entry.arguments?.getString("workerId").orEmpty().ifBlank { null }) }
        composable(
            Routes.JobDetails,
            arguments = listOf(
                navArgument("jobId") { type = NavType.StringType },
                navArgument("employerMode") { type = NavType.BoolType; defaultValue = false },
            ),
        ) { entry ->
            JobDetailsScreen(
                navController,
                entry.arguments?.getString("jobId").orEmpty(),
                employerMode = entry.arguments?.getBoolean("employerMode") ?: false,
            )
        }
        composable(Routes.Applications, arguments = listOf(navArgument("jobId") { type = NavType.StringType })) { entry -> JobApplicationsScreen(navController, entry.arguments?.getString("jobId").orEmpty()) }
        composable(Routes.WorkerDetails, arguments = listOf(navArgument("workerId") { type = NavType.StringType })) { entry -> WorkerProfileScreen(navController, entry.arguments?.getString("workerId").orEmpty()) }
        composable(Routes.Conversation, arguments = listOf(navArgument("conversationId") { type = NavType.StringType })) { entry -> ConversationScreen(navController, entry.arguments?.getString("conversationId").orEmpty()) }
        composable(Routes.Rating, arguments = listOf(navArgument("targetId") { type = NavType.StringType })) { entry -> RatingScreen(navController, entry.arguments?.getString("targetId").orEmpty()) }
    }
}

private val authGateRoutes = setOf(Routes.Splash, Routes.Onboarding, Routes.Auth, Routes.Role)
private val roleHomeRoutes = setOf(Routes.WorkerHome, Routes.EmployerHome)

private fun shouldRedirectFromState(currentRoute: String, desiredRoute: String): Boolean {
    if (currentRoute == desiredRoute) return false
    if (currentRoute == Routes.Splash) return desiredRoute != Routes.Splash
    val currentIsGate = currentRoute in authGateRoutes
    val desiredIsGate = desiredRoute in authGateRoutes
    if (currentIsGate != desiredIsGate) return true
    return currentRoute in roleHomeRoutes && desiredRoute in roleHomeRoutes
}

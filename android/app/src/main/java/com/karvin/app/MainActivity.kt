package com.karvin.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.karvin.app.core.designsystem.KarvinTheme
import com.karvin.app.core.navigation.Routes
import com.karvin.app.domain.model.AppMode
import com.karvin.app.feature.auth.LoginScreen
import com.karvin.app.feature.auth.OtpScreen
import com.karvin.app.feature.chat.ChatListScreen
import com.karvin.app.feature.chat.ConversationScreen
import com.karvin.app.feature.home.AvailabilityDeclaredScreen
import com.karvin.app.feature.home.ProviderHomeScreen
import com.karvin.app.feature.home.ProviderMapScreen
import com.karvin.app.feature.home.RequesterHomeScreen
import com.karvin.app.feature.jobs.CreateJobScreen
import com.karvin.app.feature.jobs.JobApplicationsScreen
import com.karvin.app.feature.jobs.JobDetailsScreen
import com.karvin.app.feature.jobs.JobsScreen
import com.karvin.app.feature.map.ProviderProfileScreen
import com.karvin.app.feature.map.RequestSentScreen
import com.karvin.app.feature.map.RequesterMapScreen
import com.karvin.app.feature.map.WorkAreaScreen
import com.karvin.app.feature.notifications.NotificationsScreen
import com.karvin.app.feature.onboarding.LocationExplanationScreen
import com.karvin.app.feature.onboarding.ModeSelectionScreen
import com.karvin.app.feature.onboarding.SplashScreen
import com.karvin.app.feature.payment.WalletScreen
import com.karvin.app.feature.profile.EditProfileScreen
import com.karvin.app.feature.profile.ProfileScreen
import com.karvin.app.feature.profile.ProfileViewModel
import com.karvin.app.feature.profile.SettingsScreen
import com.karvin.app.feature.workers.RatingScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val deepLinkRoute = intent?.getStringExtra("deep_link_route")
        setContent { KarvinApp(deepLinkRoute = deepLinkRoute) }
    }
}

@Composable
fun KarvinApp(
    deepLinkRoute: String? = null,
    profileViewModel: ProfileViewModel = hiltViewModel(),
) {
    val profileState by profileViewModel.state.collectAsStateWithLifecycle()
    val darkTheme = when (profileState.themeMode) {
        "light" -> false
        "dark" -> true
        else -> isSystemInDarkTheme()
    }

    KarvinTheme(darkTheme = darkTheme) {
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
            val navController = rememberNavController()

            LaunchedEffect(deepLinkRoute) {
                if (!deepLinkRoute.isNullOrBlank()) {
                    runCatching { navController.navigate(deepLinkRoute) }
                }
            }

            NavHost(
                navController = navController,
                startDestination = Routes.Splash,
                enterTransition = { androidx.compose.animation.fadeIn(animationSpec = androidx.compose.animation.core.tween(250)) + androidx.compose.animation.slideInHorizontally(initialOffsetX = { 40 }, animationSpec = androidx.compose.animation.core.tween(250)) },
                exitTransition = { androidx.compose.animation.fadeOut(animationSpec = androidx.compose.animation.core.tween(250)) },
                popEnterTransition = { androidx.compose.animation.fadeIn(animationSpec = androidx.compose.animation.core.tween(250)) },
                popExitTransition = { androidx.compose.animation.fadeOut(animationSpec = androidx.compose.animation.core.tween(250)) + androidx.compose.animation.slideOutHorizontally(targetOffsetX = { 40 }, animationSpec = androidx.compose.animation.core.tween(250)) },
            ) {

                // ─── Splash ───
                composable(Routes.Splash) {
                    SplashScreen {
                        navController.navigate(Routes.ModeSelection) {
                            popUpTo(Routes.Splash) { inclusive = true }
                        }
                    }
                }

                // ─── Auth ───
                composable(Routes.Login) {
                    LoginScreen(onOtpSent = { phone ->
                        navController.navigate(Routes.otp(phone))
                    })
                }

                composable(
                    Routes.Otp,
                    arguments = listOf(navArgument("phone") { type = NavType.StringType; defaultValue = "" }),
                ) { entry ->
                    OtpScreen(
                        phone = entry.arguments?.getString("phone").orEmpty(),
                        onAuthenticated = {
                            navController.navigate(Routes.ModeSelection) {
                                popUpTo(Routes.Login) { inclusive = true }
                            }
                        },
                    )
                }

                // ─── Mode Selection ───
                composable(Routes.ModeSelection) {
                    ModeSelectionScreen { mode ->
                        when (mode) {
                            AppMode.REQUESTER -> {
                                navController.navigate(Routes.RequesterLocationExplanation) {
                                    popUpTo(Routes.ModeSelection) { inclusive = true }
                                }
                            }
                            AppMode.PROVIDER -> {
                                navController.navigate(Routes.ProviderLocationExplanation) {
                                    popUpTo(Routes.ModeSelection) { inclusive = true }
                                }
                            }
                        }
                    }
                }

                // ─── Requester Flow ───
                composable(Routes.RequesterLocationExplanation) {
                    LocationExplanationScreen(
                        title = "متخصص‌های نزدیک شما",
                        description = "برای یافتن متخصص‌های نزدیک و نمایش آنها بر اساس موقعیت مکانی، KARVIN به موقعیت شما نیاز دارد.",
                        accent = androidx.compose.material3.MaterialTheme.colorScheme.primary,
                        onContinue = {
                            navController.navigate(Routes.RequesterHome) {
                                popUpTo(Routes.RequesterLocationExplanation) { inclusive = true }
                            }
                        },
                        onDemo = {
                            navController.navigate(Routes.RequesterHome) {
                                popUpTo(Routes.RequesterLocationExplanation) { inclusive = true }
                            }
                        },
                        onLater = {
                            navController.navigate(Routes.RequesterHome) {
                                popUpTo(Routes.RequesterLocationExplanation) { inclusive = true }
                            }
                        },
                    )
                }

                composable(Routes.RequesterHome) {
                    RequesterHomeScreen(navController)
                }

                composable(Routes.RequesterMap) {
                    RequesterMapScreen(navController)
                }

                composable(Routes.RequesterJobs) {
                    JobsScreen(navController, employerMode = true)
                }

                composable(Routes.CreateJob) {
                    CreateJobScreen(navController)
                }

                // ─── Provider Flow ───
                composable(Routes.ProviderLocationExplanation) {
                    LocationExplanationScreen(
                        title = "درخواست‌های نزدیک شما",
                        description = "برای نمایش درخواست‌های نزدیک و تعیین محدوده فعالیت، به موقعیت شما نیاز داریم.",
                        accent = androidx.compose.material3.MaterialTheme.colorScheme.secondary,
                        onContinue = {
                            navController.navigate(Routes.ProviderHome) {
                                popUpTo(Routes.ProviderLocationExplanation) { inclusive = true }
                            }
                        },
                        onDemo = {
                            navController.navigate(Routes.ProviderHome) {
                                popUpTo(Routes.ProviderLocationExplanation) { inclusive = true }
                            }
                        },
                        onLater = {
                            navController.navigate(Routes.ProviderHome) {
                                popUpTo(Routes.ProviderLocationExplanation) { inclusive = true }
                            }
                        },
                    )
                }

                composable(Routes.ProviderHome) {
                    ProviderHomeScreen(navController)
                }

                composable(Routes.ProviderMap) {
                    ProviderMapScreen(navController)
                }

                composable(Routes.ProviderJobs) {
                    JobsScreen(navController, employerMode = false)
                }

                composable(Routes.ProviderWorkArea) {
                    WorkAreaScreen(navController)
                }

                composable(Routes.AvailabilityDeclared) {
                    AvailabilityDeclaredScreen(navController)
                }

                // ─── Jobs Management Flow ───
                composable(
                    Routes.JobDetails,
                    arguments = listOf(
                        navArgument("jobId") { type = NavType.StringType },
                        navArgument("employerMode") { type = NavType.BoolType; defaultValue = false },
                    ),
                ) { entry ->
                    val jobId = entry.arguments?.getString("jobId").orEmpty()
                    val employerMode = entry.arguments?.getBoolean("employerMode") ?: false
                    JobDetailsScreen(navController, jobId = jobId, employerMode = employerMode)
                }

                composable(
                    Routes.Applications,
                    arguments = listOf(navArgument("jobId") { type = NavType.StringType }),
                ) { entry ->
                    val jobId = entry.arguments?.getString("jobId").orEmpty()
                    JobApplicationsScreen(navController, jobId = jobId)
                }

                // ─── Shared screens ───
                composable(
                    Routes.RequestSent,
                    arguments = listOf(navArgument("provider") { type = NavType.BoolType; defaultValue = false }),
                ) { entry ->
                    RequestSentScreen(
                        navController,
                        providerMode = entry.arguments?.getBoolean("provider") ?: false,
                    )
                }

                composable(
                    Routes.ProviderProfile,
                    arguments = listOf(navArgument("providerId") { type = NavType.StringType }),
                ) { entry ->
                    ProviderProfileScreen(
                        navController,
                        entry.arguments?.getString("providerId").orEmpty(),
                    )
                }

                composable(Routes.Chat) {
                    ChatListScreen(navController)
                }

                composable(Routes.Profile) {
                    ProfileScreen(navController)
                }

                composable(Routes.EditProfile) {
                    EditProfileScreen(navController)
                }

                composable(Routes.Notifications) {
                    NotificationsScreen(navController)
                }

                composable(Routes.Settings) {
                    SettingsScreen(navController)
                }

                composable(Routes.Wallet) {
                    WalletScreen(navController)
                }

                composable(
                    Routes.Rating,
                    arguments = listOf(navArgument("targetId") { type = NavType.StringType }),
                ) { entry ->
                    val targetId = entry.arguments?.getString("targetId").orEmpty()
                    RatingScreen(navController, targetId = targetId)
                }

                composable(
                    Routes.Conversation,
                    arguments = listOf(navArgument("conversationId") { type = NavType.StringType }),
                ) { entry ->
                    ConversationScreen(
                        navController,
                        entry.arguments?.getString("conversationId").orEmpty(),
                    )
                }
            }
        }
    }
}

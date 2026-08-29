package com.karvin.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.karvin.app.core.designsystem.KarvinTheme
import com.karvin.app.core.navigation.Routes
import com.karvin.app.domain.model.AppMode
import com.karvin.app.feature.chat.ChatListScreen
import com.karvin.app.feature.chat.ConversationScreen
import com.karvin.app.feature.home.ProviderHomeScreen
import com.karvin.app.feature.home.RequesterHomeScreen
import com.karvin.app.feature.home.AvailabilityDeclaredScreen
import com.karvin.app.feature.home.ProviderMapScreen
import com.karvin.app.feature.map.ProviderProfileScreen
import com.karvin.app.feature.map.RequesterMapScreen
import com.karvin.app.feature.map.RequestSentScreen
import com.karvin.app.feature.map.WorkAreaScreen
import com.karvin.app.feature.notifications.NotificationsScreen
import com.karvin.app.feature.onboarding.LocationExplanationScreen
import com.karvin.app.feature.onboarding.ModeSelectionScreen
import com.karvin.app.feature.onboarding.SplashScreen
import com.karvin.app.feature.profile.ProfileScreen
import com.karvin.app.feature.profile.ProfileViewModel
import com.karvin.app.feature.profile.SettingsScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { KarvinApp() }
    }
}

@Composable
fun KarvinApp(profileViewModel: ProfileViewModel = hiltViewModel()) {
    val profileState by profileViewModel.state.collectAsStateWithLifecycle()
    val darkTheme = when (profileState.themeMode) {
        "light" -> false
        "dark" -> true
        else -> isSystemInDarkTheme()
    }

    KarvinTheme(darkTheme = darkTheme) {
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
            val navController = rememberNavController()

            NavHost(navController = navController, startDestination = Routes.Splash) {

                // ─── Splash ───
                composable(Routes.Splash) {
                    SplashScreen {
                        navController.navigate(Routes.ModeSelection) {
                            popUpTo(Routes.Splash) { inclusive = true }
                        }
                    }
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
                            navController.navigate(Routes.RequesterMap) {
                                popUpTo(Routes.RequesterLocationExplanation) { inclusive = true }
                            }
                        },
                        onDemo = {
                            navController.navigate(Routes.RequesterMap) {
                                popUpTo(Routes.RequesterLocationExplanation) { inclusive = true }
                            }
                        },
                        onLater = {
                            navController.navigate(Routes.RequesterMap) {
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
                    // Placeholder - will show request history
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center,
                    ) {
                        androidx.compose.material3.Text("درخواست‌های من")
                    }
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
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center,
                    ) {
                        androidx.compose.material3.Text("فعالیت‌ها")
                    }
                }

                composable(Routes.ProviderWorkArea) {
                    WorkAreaScreen(navController)
                }

                composable(Routes.AvailabilityDeclared) {
                    AvailabilityDeclaredScreen(navController)
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

                composable(Routes.Notifications) {
                    NotificationsScreen(navController)
                }

                composable(Routes.Settings) {
                    SettingsScreen(navController)
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

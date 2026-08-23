package com.karvin.app.presentation.splash

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.presentation.components.KarvinLogo
import com.karvin.app.presentation.theme.Emerald400
import com.karvin.app.presentation.theme.Navy900

@Composable
fun SplashScreen(
    onNavigateToRoleSelection: () -> Unit,
    onNavigateToWorkerHome: () -> Unit,
    onNavigateToEmployerDashboard: () -> Unit,
    viewModel: SplashViewModel = hiltViewModel()
) {
    val destination by viewModel.destination.collectAsState()

    LaunchedEffect(destination) {
        when (destination) {
            is SplashDestination.RoleSelection -> onNavigateToRoleSelection()
            is SplashDestination.WorkerHome -> onNavigateToWorkerHome()
            is SplashDestination.EmployerDashboard -> onNavigateToEmployerDashboard()
            is SplashDestination.Idle -> Unit
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Navy900),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            KarvinLogo(
                size = 110.dp,
                showText = true,
                showSlogan = true,
                animated = true,
                textColor = Color.White
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "پلتفرم هوشمند کار و مهارت",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(48.dp))

            CircularProgressIndicator(
                modifier = Modifier.size(28.dp),
                color = Emerald400,
                strokeWidth = 2.5.dp
            )
        }
    }
}

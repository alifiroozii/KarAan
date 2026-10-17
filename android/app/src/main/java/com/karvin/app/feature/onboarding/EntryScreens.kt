package com.karvin.app.feature.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Handyman
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.karvin.app.core.designsystem.KarvinBrandMark
import com.karvin.app.core.designsystem.KarvinLogo
import com.karvin.app.core.designsystem.PrimaryButton
import com.karvin.app.domain.model.AppMode
import kotlinx.coroutines.delay

// ──────────────────────── Splash ────────────────────────

/**
 * Legacy Splash entry point, replaced by the KARJOOR splash in
 * `KarjoorEntryScreens.kt`. Retained as a forwarder so any external call site
 * keeps working without knowing which splash implementation is active.
 */
@Composable
fun SplashScreen(onFinished: () -> Unit) {
    KarjoorSplashScreen(onFinished)
}

// ──────────────────────── Mode Selection ────────────────────────

@Composable
fun ModeSelectionScreen(
    onModeSelected: (AppMode) -> Unit,
    onLoginClick: (() -> Unit)? = null,
) {
    KarjoorRoleSelectionScreen(
        onRoleSelected = { role ->
            when (role) {
                com.karvin.app.core.designsystem.KarjoorRole.REQUESTER -> onModeSelected(AppMode.REQUESTER)
                com.karvin.app.core.designsystem.KarjoorRole.PERFORMER -> onModeSelected(AppMode.PROVIDER)
            }
        },
        onLoginWithGmailClick = onLoginClick,
    )
}

@Composable
private fun ModeCard(
    title: String,
    subtitle: String,
    badge: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accent: Color,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .semantics { contentDescription = title },
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, accent.copy(alpha = .25f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = accent.copy(alpha = .14f),
                    modifier = Modifier.size(60.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(28.dp))
                    }
                }
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = accent, modifier = Modifier.size(20.dp))
            }
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = accent.copy(alpha = .10f),
            ) {
                Text(
                    badge,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = accent,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }
}

// ──────────────────────── Location Explanation ────────────────────────

@Composable
fun LocationExplanationScreen(
    title: String,
    description: String,
    accent: Color,
    onContinue: () -> Unit,
    onDemo: () -> Unit,
    onLater: () -> Unit,
) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(horizontal = 28.dp, vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // Map preview placeholder
        Box(
            Modifier
                .fillMaxWidth()
                .height(180.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(accent.copy(alpha = .12f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Default.LocationOn,
                    contentDescription = null,
                    tint = accent,
                    modifier = Modifier.size(36.dp),
                )
            }
        }

        Spacer(Modifier.height(28.dp))

        Text(title, style = MaterialTheme.typography.headlineSmall, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        Spacer(Modifier.height(10.dp))
        Text(
            description,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )

        Spacer(Modifier.height(32.dp))

        PrimaryButton("ادامه", onContinue, Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        OutlinedButton(onClick = onDemo, modifier = Modifier.fillMaxWidth()) {
            Text("ادامه با حالت نمایشی")
        }
        Spacer(Modifier.height(6.dp))
        TextButton(onClick = onLater, modifier = Modifier.fillMaxWidth()) {
            Text("فعلاً نه", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

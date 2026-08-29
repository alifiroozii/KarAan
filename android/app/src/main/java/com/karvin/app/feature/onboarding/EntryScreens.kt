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
import com.karvin.app.domain.model.AppMode
import com.karvin.app.core.designsystem.PrimaryButton
import kotlinx.coroutines.delay

// ──────────────────────── Splash ────────────────────────

@Composable
fun SplashScreen(onFinished: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(1200)
        onFinished()
    }
    Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.primary), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Surface(shape = RoundedCornerShape(26.dp), color = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(88.dp).shadow(18.dp, RoundedCornerShape(26.dp), ambientColor = Color.Black.copy(alpha = .16f), spotColor = Color.Black.copy(alpha = .16f))) {
                Box(contentAlignment = Alignment.Center) { Text("ک", style = MaterialTheme.typography.displaySmall, color = Color.White, fontWeight = FontWeight.Bold) }
            }
            Text("کاروین", style = MaterialTheme.typography.displaySmall, color = Color.White, fontWeight = FontWeight.Bold)
            Text("خدمت نزدیکت را پیدا کن", style = MaterialTheme.typography.bodyLarge, color = Color.White.copy(alpha = .82f))
        }
    }
}

// ──────────────────────── Mode Selection ────────────────────────

@Composable
fun ModeSelectionScreen(onModeSelected: (AppMode) -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .background(Color(0xFFFAFAF8))
            .padding(horizontal = 24.dp, vertical = 32.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Spacer(Modifier.height(24.dp))

        // Logo
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .shadow(8.dp, RoundedCornerShape(10.dp), ambientColor = MaterialTheme.colorScheme.primary.copy(alpha = .2f), spotColor = MaterialTheme.colorScheme.primary.copy(alpha = .2f))
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center,
            ) {
                Text("ک", style = MaterialTheme.typography.titleLarge, color = Color.White)
            }
            Spacer(Modifier.width(10.dp))
            Text("کاروین", style = MaterialTheme.typography.titleLarge)
        }

        Spacer(Modifier.height(16.dp))

        Text(
            "چه کاری می‌خواهید انجام دهید؟",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "هر زمان خواستید می‌توانید حالت خود را تغییر دهید.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(Modifier.height(12.dp))

        // Requester card
        ModeCard(
            title = "خدمت می‌خواهم",
            subtitle = "متخصص‌های نزدیک خود را پیدا کنید",
            icon = Icons.Default.Search,
            accent = MaterialTheme.colorScheme.primary,
            onClick = { onModeSelected(AppMode.REQUESTER) },
        )

        // Provider card
        ModeCard(
            title = "خدمت ارائه می‌دهم",
            subtitle = "درخواست‌های نزدیک خود را ببینید",
            icon = Icons.Default.Handyman,
            accent = MaterialTheme.colorScheme.secondary,
            onClick = { onModeSelected(AppMode.PROVIDER) },
        )

        Spacer(Modifier.weight(1f))

        Text(
            "نسخه نمایشی · بدون نیاز به ورود",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun ModeCard(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accent: Color,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .semantics { contentDescription = title },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, accent.copy(alpha = .18f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Row(
            Modifier.padding(22.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = accent.copy(alpha = .14f),
                modifier = Modifier.size(64.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(30.dp))
                }
            }
            Spacer(Modifier.width(18.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text("‹", style = MaterialTheme.typography.headlineSmall, color = accent)
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

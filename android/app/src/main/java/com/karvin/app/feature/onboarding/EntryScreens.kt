package com.karvin.app.feature.onboarding

import androidx.compose.foundation.background
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
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.filled.Handyman
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Close
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.karvin.app.core.designsystem.KarvinLogo
import com.karvin.app.core.designsystem.PrimaryButton
import com.karvin.app.domain.model.UserRole
import kotlinx.coroutines.launch

@Composable
fun SplashScreen(onFinished: () -> Unit) {
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(650)
        onFinished()
    }
    Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.primary), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Surface(shape = RoundedCornerShape(26.dp), color = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(88.dp)) {
                Box(contentAlignment = Alignment.Center) { Text("ک", style = MaterialTheme.typography.displaySmall, color = Color.White, fontWeight = FontWeight.Bold) }
            }
            Text("کاروین", style = MaterialTheme.typography.displaySmall, color = Color.White, fontWeight = FontWeight.Bold)
            Text("متخصص مورد نظرت را پیدا کن", style = MaterialTheme.typography.bodyLarge, color = Color.White.copy(alpha = .82f))
        }
    }
}

private data class OnboardingPage(val title: String, val body: String, val icon: @Composable () -> Unit)

@Composable
fun OnboardingScreen(onFinished: () -> Unit) {
    val pages = listOf(
        OnboardingPage("خدمت نزدیکت را پیدا کن", "متخصص‌های اطراف را روی نقشه ببین و با چند لمس خدمت مناسب را انتخاب کن.") { Icon(Icons.Default.Search, null, modifier = Modifier.size(72.dp), tint = MaterialTheme.colorScheme.primary) },
        OnboardingPage("خدمتت را ارائه بده", "اگر مهارتی داری، درخواست‌های نزدیک را ببین و فرصت‌های مناسب را پیدا کن.") { Icon(Icons.Default.BusinessCenter, null, modifier = Modifier.size(72.dp), tint = MaterialTheme.colorScheme.secondary) },
        OnboardingPage("انتخابی ساده و مطمئن", "حالت استفاده‌ات را هر زمان خواستی تغییر بده؛ کاروین برای هر دو مسیر آماده است.") { Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(72.dp), tint = MaterialTheme.colorScheme.tertiary) },
    )
    val pager = rememberPagerState(pageCount = { pages.size })
    val scope = rememberCoroutineScope()
    Column(Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 28.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            KarvinLogo()
            TextButton(onClick = onFinished) { Text("رد کردن") }
        }
        HorizontalPager(state = pager, modifier = Modifier.weight(1f).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { page ->
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(22.dp), modifier = Modifier.fillMaxWidth()) {
                Box(Modifier.size(190.dp).clip(RoundedCornerShape(48.dp)).background(MaterialTheme.colorScheme.primaryContainer), contentAlignment = Alignment.Center) { pages[page].icon() }
                Text(pages[page].title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text(pages[page].body, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.fillMaxWidth(.9f))
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
            repeat(pages.size) { index ->
                Box(Modifier.padding(4.dp).size(if (pager.currentPage == index) 24.dp else 8.dp, 8.dp).clip(RoundedCornerShape(4.dp)).background(if (pager.currentPage == index) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant))
            }
        }
        Spacer(Modifier.height(20.dp))
        PrimaryButton(if (pager.currentPage == pages.lastIndex) "ورود به کاروین" else "بعدی", onClick = {
            if (pager.currentPage == pages.lastIndex) onFinished() else scope.launch { pager.animateScrollToPage(pager.currentPage + 1) }
        }, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
fun AuthScreen(onSubmit: (String) -> Unit) {
    var phone by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    Column(Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 30.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        KarvinLogo()
        Spacer(Modifier.height(32.dp))
        Text("شروع کنید", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("برای این نسخه نمایشی نیازی به ورود یا شماره موبایل نیست.", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedTextField(
            value = phone,
            onValueChange = { value -> phone = value.filter { it.isDigit() || it == '+' }.take(13); error = null },
            label = { Text("شماره موبایل (اختیاری)") },
            placeholder = { Text("۰۹۱۲۱۲۳۴۵۶۷") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            modifier = Modifier.fillMaxWidth().semantics { contentDescription = "ورودی شماره موبایل" },
            isError = error != null,
            supportingText = error?.let { { Text(it) } },
        )
        Spacer(Modifier.weight(1f))
        Text("در این نسخه، اطلاعات شما فقط روی دستگاه نگهداری می‌شود.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        PrimaryButton("ادامه", onClick = {
            onSubmit(phone.ifBlank { "09000000000" })
        }, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
fun RoleScreen(onRoleSelected: (UserRole) -> Unit) {
    Column(Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 30.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        KarvinLogo()
        Spacer(Modifier.height(35.dp))
        Text("چه کاری می‌خواهید انجام دهید؟", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("حالت استفاده‌تان را انتخاب کنید؛ هر زمان خواستید می‌توانید تغییرش دهید.", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(14.dp))
        RoleCard("حالت", "ارائه می‌دهم", "ارائه‌ی هر نوع خدمت خانگی و ارائه مهارت.", Icons.Default.BusinessCenter, MaterialTheme.colorScheme.secondary) { onRoleSelected(UserRole.WORKER) }
        RoleCard("حالت", "می‌خواهم", "برای خودم یا دیگران درخواست خدمت ثبت کنید.", Icons.Default.Search, MaterialTheme.colorScheme.primary) { onRoleSelected(UserRole.EMPLOYER) }
    }
}

@Composable
private fun RoleCard(caption: String, title: String, body: String, icon: androidx.compose.ui.graphics.vector.ImageVector, accent: Color, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = accent.copy(alpha = .08f))) {
        Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(shape = RoundedCornerShape(14.dp), color = accent.copy(alpha = .16f), modifier = Modifier.size(58.dp)) {
                Box(contentAlignment = Alignment.Center) { Icon(icon, contentDescription = null, tint = accent) }
            }
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(caption, style = MaterialTheme.typography.labelSmall, color = accent)
                Text(title, style = MaterialTheme.typography.titleLarge)
                Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "انتخاب", tint = accent)
        }
    }
}

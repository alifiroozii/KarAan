package com.karvin.app.feature.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.Avatar
import com.karvin.app.core.designsystem.EmptyState
import com.karvin.app.core.designsystem.RatingLine
import com.karvin.app.core.navigation.Routes
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.model.toPersianDigits

@Composable
fun ProfileScreen(navController: NavHostController, viewModel: ProfileViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var showRoleDialog by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize()) {
        AppTopBar("پروفایل", onBack = { navController.popBackStack() }, actions = { IconButton(onClick = { navController.navigate(Routes.Settings) }) { Icon(Icons.Default.Settings, "تنظیمات") } })
        if (state.user == null) EmptyState("پروفایل آماده نیست", "بعد از ورود اطلاعات شما اینجا نمایش داده می‌شود.") else {
            val user = state.user!!
            androidx.compose.foundation.lazy.LazyColumn(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item { Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer), shape = RoundedCornerShape(20.dp)) { Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) { Avatar(user, size = 72.dp); Column(Modifier.padding(horizontal = 14.dp).weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) { Text(user.name, style = MaterialTheme.typography.headlineSmall); Text("${user.city} · ${if (user.role == UserRole.WORKER) "کارگر" else "کارفرما"}", color = MaterialTheme.colorScheme.onSurfaceVariant); RatingLine(user.rating, user.reviewCount) }; Icon(Icons.Default.Edit, "ویرایش پروفایل", tint = MaterialTheme.colorScheme.primary) } } }
                if (user.role == UserRole.WORKER) item { EarningsCard(user.completedJobs) }
                item { ProfileAction("نقش فعلی", if (user.role == UserRole.WORKER) "کارگر" else "کارفرما") { showRoleDialog = true } }
                item { ProfileAction("تنظیمات و حریم خصوصی", "اعلان‌ها، ظاهر و دسترسی‌ها") { navController.navigate(Routes.Settings) } }
                item { ProfileAction("اعلان‌ها", "مرکز اعلان‌ها") { navController.navigate(Routes.Notifications) } }
                if (user.role == UserRole.WORKER) item { ProfileAction("درخواست‌های من", "پیگیری وضعیت درخواست‌های همکاری") { navController.navigate(Routes.WorkerApplications) } }
                item { Spacer(Modifier.height(20.dp)); OutlinedButton(onClick = viewModel::signOut, modifier = Modifier.fillMaxWidth()) { Icon(Icons.AutoMirrored.Filled.Logout, null); Text("خروج از حساب", Modifier.padding(start = 7.dp)) } }
            }
        }
    }
    if (showRoleDialog) AlertDialog(onDismissRequest = { showRoleDialog = false }, title = { Text("تغییر نقش") }, text = { Column { listOf(UserRole.WORKER, UserRole.EMPLOYER).forEach { role -> Row(verticalAlignment = Alignment.CenterVertically) { RadioButton(selected = state.user?.role == role, onClick = { viewModel.setRole(role); showRoleDialog = false }); Text(if (role == UserRole.WORKER) "کارگر" else "کارفرما") } } } }, confirmButton = { TextButton(onClick = { showRoleDialog = false }) { Text("بستن") } })
}

@Composable
private fun EarningsCard(completedJobs: Int) { Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) { Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Text("خلاصه عملکرد", style = MaterialTheme.typography.titleLarge); Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Column { Text("درآمد این ماه", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); Text("${(completedJobs * 850000L).toString().toPersianDigits()} تومان", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary) }; Column(horizontalAlignment = Alignment.End) { Text("کارهای تکمیل‌شده", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); Text(completedJobs.toString().toPersianDigits(), style = MaterialTheme.typography.titleMedium) } } } } }

@Composable
private fun ProfileAction(title: String, subtitle: String, onClick: () -> Unit) { Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) { Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) { Text(title, style = MaterialTheme.typography.titleMedium); Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; Text("‹", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary) } } }

@Composable
fun SettingsScreen(navController: NavHostController, viewModel: ProfileViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    Column(Modifier.fillMaxSize()) {
        AppTopBar("تنظیمات", onBack = { navController.popBackStack() })
        Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("ظاهر برنامه", style = MaterialTheme.typography.titleLarge)
            ThemeOption("همیشه روشن", "light", state.themeMode, Icons.Default.WbSunny) { viewModel.setTheme("light") }
            ThemeOption("همیشه تیره", "dark", state.themeMode, Icons.Default.DarkMode) { viewModel.setTheme("dark") }
            ThemeOption("بر اساس تنظیمات گوشی", "system", state.themeMode, Icons.Default.Settings) { viewModel.setTheme("system") }
            Spacer(Modifier.height(10.dp))
            Text("دسترسی‌ها", style = MaterialTheme.typography.titleLarge)
            ProfileAction("موقعیت مکانی", "برای نمایش کارها و نیروهای نزدیک") { navController.navigate(Routes.WorkerMap) }
            ProfileAction("اعلان‌ها", "برای دریافت تغییرات درخواست‌ها") { navController.navigate(Routes.Notifications) }
            Text("نسخه ۱٫۰٫۰ · کاروین", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 20.dp))
        }
    }
}

@Composable
private fun ThemeOption(title: String, value: String, selected: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) { Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = if (selected == value) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant)) { Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(icon, null, tint = MaterialTheme.colorScheme.primary); Text(title, Modifier.padding(horizontal = 12.dp).weight(1f)); RadioButton(selected = selected == value, onClick = onClick) } } }

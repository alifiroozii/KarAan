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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.Avatar
import com.karvin.app.core.designsystem.EmptyState
import com.karvin.app.core.designsystem.RatingLine
import com.karvin.app.core.navigation.Routes
import com.karvin.app.domain.model.UserRole
import com.karvin.app.core.designsystem.KarvinScaffold
import androidx.compose.foundation.BorderStroke
import com.karvin.app.domain.model.toPersianDigits

@Composable
fun ProfileScreen(navController: NavHostController, viewModel: ProfileViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var showRoleDialog by remember { mutableStateOf(false) }
    KarvinScaffold(navController, state.user?.role ?: UserRole.PROVIDER, content = { padding ->
    Column(Modifier.fillMaxSize().padding(padding)) {
        AppTopBar("پروفایل", onBack = { navController.popBackStack() }, actions = { IconButton(onClick = { navController.navigate(Routes.Settings) }) { Icon(Icons.Default.Settings, "تنظیمات") } })
        if (state.user == null) EmptyState("پروفایل آماده نیست", "بعد از ورود اطلاعات شما اینجا نمایش داده می‌شود.") else {
            val user = state.user!!
            androidx.compose.foundation.lazy.LazyColumn(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item {
                    Card(
                        onClick = { navController.navigate(Routes.EditProfile) },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                        shape = RoundedCornerShape(20.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    ) {
                        Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                            Avatar(user, size = 72.dp)
                            Column(Modifier.padding(horizontal = 14.dp).weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                Text(user.name, style = MaterialTheme.typography.titleLarge, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                                Text("${user.city} · ${if (user.role == UserRole.PROVIDER) "متخصص" else "متقاضی خدمت"}", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
                                RatingLine(user.rating, user.reviewCount)
                            }
                            IconButton(onClick = { navController.navigate(Routes.EditProfile) }) {
                                Icon(Icons.Default.Edit, "ویرایش پروفایل", tint = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                }
                if (user.role == UserRole.PROVIDER) item { EarningsCard(user.completedJobs) }
                item { ProfileAction("ویرایش اطلاعات و مهارت‌ها", "تکمیل نام، تخصص‌ها، شهر و بیوگرافی") { navController.navigate(Routes.EditProfile) } }
                item { ProfileAction("کیف پول و تراکنش‌ها", "مشاهده موجودی و مدیریت پرداخت‌ها") { navController.navigate(Routes.Wallet) } }
                item { ProfileAction("حالت فعلی", if (user.role == UserRole.PROVIDER) "ارائه می‌دهم" else "می‌خواهم") { showRoleDialog = true } }
                item { ProfileAction("تنظیمات و حریم خصوصی", "اعلان‌ها، ظاهر و دسترسی‌ها") { navController.navigate(Routes.Settings) } }
                item { ProfileAction("اعلان‌ها", "مرکز اعلان‌ها") { navController.navigate(Routes.Notifications) } }
                if (user.role == UserRole.PROVIDER) {
                    item { ProfileAction("فعالیت‌ها و برنامه‌ها", "پیگیری وضعیت درخواست‌های همکاری") { navController.navigate(Routes.ProviderJobs) } }
                    item { ProfileAction("محدوده فعالیت", "انتخاب شعاع نمایش درخواست‌ها") { navController.navigate(Routes.WorkArea) } }
                } else {
                    item { ProfileAction("سفارش‌های من", "پیگیری کارهای ثبت‌شده") { navController.navigate(Routes.RequesterJobs) } }
                }
                item { Spacer(Modifier.height(20.dp)); OutlinedButton(onClick = viewModel::signOut, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) { Icon(Icons.AutoMirrored.Filled.Logout, null); Text("خروج از حساب", Modifier.padding(start = 7.dp)) } }
            }
        }
    }
    })
    if (showRoleDialog) AlertDialog(onDismissRequest = { showRoleDialog = false }, title = { Text("تغییر حالت استفاده") }, text = { Column { listOf(UserRole.PROVIDER, UserRole.REQUESTER).forEach { role -> Row(verticalAlignment = Alignment.CenterVertically) { RadioButton(selected = state.user?.role == role, onClick = { viewModel.setRole(role); showRoleDialog = false; navController.navigate(if (role == UserRole.PROVIDER) Routes.ProviderHome else Routes.RequesterHome) { popUpTo(navController.graph.findStartDestination().id) { inclusive = true }; launchSingleTop = true } }); Text(if (role == UserRole.PROVIDER) "ارائه می‌دهم" else "می‌خواهم") } } } }, confirmButton = { TextButton(onClick = { showRoleDialog = false }) { Text("بستن") } })
}

@Composable
private fun EarningsCard(completedJobs: Int) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("خلاصه عملکرد", style = MaterialTheme.typography.titleMedium, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("درآمد این ماه", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("${(completedJobs * 850000L).toString().toPersianDigits()} تومان", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("کارهای تکمیل‌شده", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(completedJobs.toString().toPersianDigits(), style = MaterialTheme.typography.titleMedium, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun ProfileAction(title: String, subtitle: String, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(18.dp))
        }
    }
}

@Composable
fun SettingsScreen(navController: NavHostController, viewModel: ProfileViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    KarvinScaffold(navController, state.user?.role ?: UserRole.PROVIDER, content = { padding ->
    Column(Modifier.fillMaxSize().padding(padding)) {
        AppTopBar("تنظیمات", onBack = { navController.popBackStack() })
        Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("ظاهر برنامه", style = MaterialTheme.typography.titleLarge)
            ThemeOption("همیشه روشن", "light", state.themeMode, Icons.Default.WbSunny) { viewModel.setTheme("light") }
            ThemeOption("همیشه تیره", "dark", state.themeMode, Icons.Default.DarkMode) { viewModel.setTheme("dark") }
            ThemeOption("بر اساس تنظیمات گوشی", "system", state.themeMode, Icons.Default.Settings) { viewModel.setTheme("system") }
            Spacer(Modifier.height(10.dp))
            Text("دسترسی‌ها", style = MaterialTheme.typography.titleLarge)
            ProfileAction("موقعیت مکانی", "برای نمایش درخواست‌ها و متخصص‌های نزدیک") { navController.navigate(Routes.ProviderMap) }
            ProfileAction("اعلان‌ها", "برای دریافت تغییرات درخواست‌ها") { navController.navigate(Routes.Notifications) }
            Text("نسخه ۱٫۰٫۰ · کاروین", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 20.dp))
        }
    }
    })
}

@Composable
private fun ThemeOption(title: String, value: String, selected: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) { Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = if (selected == value) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant)) { Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(icon, null, tint = MaterialTheme.colorScheme.primary); Text(title, Modifier.padding(horizontal = 12.dp).weight(1f)); RadioButton(selected = selected == value, onClick = onClick) } } }

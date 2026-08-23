package com.karvin.app.presentation.common

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.karvin.app.R
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Emerald100
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight

@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit
) {
    var darkModeEnabled by remember { mutableStateOf(false) }
    var pushNotificationsEnabled by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.settings),
                onBackClick = onNavigateBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            Text(text = "تنظیمات عمومی", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))

            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
                    SettingToggleRow(
                        title = stringResource(id = R.string.dark_mode),
                        icon = Icons.Default.DarkMode,
                        isChecked = darkModeEnabled,
                        onCheckedChange = { darkModeEnabled = it }
                    )
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    SettingToggleRow(
                        title = "اعلان‌ها و یادآوری شیفت‌ها",
                        icon = Icons.Default.Notifications,
                        isChecked = pushNotificationsEnabled,
                        onCheckedChange = { pushNotificationsEnabled = it }
                    )
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    SettingInfoRow(
                        title = "زبان برنامه",
                        value = "فارسی (پیش‌فرض)",
                        icon = Icons.Default.Language
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(text = "درباره اپلیکیشن", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))

            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    SettingInfoRow(
                        title = "نسخه کاروین",
                        value = "1.0.0 (نسخه آزمایشی)",
                        icon = Icons.Default.Info
                    )
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    SettingInfoRow(
                        title = "سیاست حفظ حریم خصوصی و امنیت",
                        value = "امن و رمزگذاری شده",
                        icon = Icons.Default.Security
                    )
                }
            }
        }
    }
}

@Composable
private fun SettingToggleRow(
    title: String,
    icon: ImageVector,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(imageVector = icon, contentDescription = null, tint = Navy900, modifier = Modifier.size(22.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(text = title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
        }
        Switch(
            checked = isChecked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Emerald600,
                checkedTrackColor = Emerald100
            )
        )
    }
}

@Composable
private fun SettingInfoRow(
    title: String,
    value: String,
    icon: ImageVector
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(imageVector = icon, contentDescription = null, tint = Navy900, modifier = Modifier.size(22.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(text = title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
        }
        Text(text = value, style = MaterialTheme.typography.bodyMedium, color = TextSecondaryLight)
    }
}

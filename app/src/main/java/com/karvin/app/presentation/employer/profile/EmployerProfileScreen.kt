package com.karvin.app.presentation.employer.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinCard
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Amber500
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.Red500
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter

@Composable
fun EmployerProfileScreen(
    onNavigateToSettings: () -> Unit,
    onNavigateToEditProfile: () -> Unit,
    onLogout: () -> Unit,
    viewModel: EmployerProfileViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val scroll = rememberScrollState()
    var showLogoutDialog by remember { mutableStateOf(false) }

    LaunchedEffect(state.isLoggedOut) {
        if (state.isLoggedOut) {
            onLogout()
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text(text = stringResource(id = R.string.logout), fontWeight = FontWeight.Bold) },
            text = { Text(text = stringResource(id = R.string.logout_confirm)) },
            confirmButton = {
                KarvinButton(
                    text = stringResource(id = R.string.confirm),
                    onClick = {
                        showLogoutDialog = false
                        viewModel.logout()
                    },
                    type = KarvinButtonType.DANGER,
                    modifier = Modifier.width(100.dp),
                    height = 38.dp,
                    shapeRadius = 8.dp
                )
            },
            dismissButton = {
                KarvinButton(
                    text = stringResource(id = R.string.cancel),
                    onClick = { showLogoutDialog = false },
                    type = KarvinButtonType.OUTLINED,
                    modifier = Modifier.width(100.dp),
                    height = 38.dp,
                    shapeRadius = 8.dp
                )
            }
        )
    }

    val profile = state.profile

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = "پروفایل کارفرما",
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = MaterialTheme.colorScheme.onSurface)
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
                .verticalScroll(scroll)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Business Profile Header Card
            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(Navy900),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Business,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(38.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = profile?.businessName ?: "شرکت ساختمانی سازه گستر البرز",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(Icons.Default.Verified, contentDescription = "Verified", tint = Emerald600, modifier = Modifier.size(18.dp))
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = profile?.fullName ?: "مهندس علیرضا رضایی",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondaryLight
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = Amber500, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${PersianDateFormatter.toPersianDigits(profile?.rating ?: 4.9f)} ستاره اعتبار کارفرمایی",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium,
                            color = TextSecondaryLight
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 2-item Stats Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "آگهی‌های ثبت شده", style = MaterialTheme.typography.bodySmall, color = TextSecondaryLight)
                            Text(text = "${PersianDateFormatter.toPersianDigits(profile?.postedJobsCount ?: 12)} مورد", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "شیفت‌های موفق", style = MaterialTheme.typography.bodySmall, color = TextSecondaryLight)
                            Text(text = "${PersianDateFormatter.toPersianDigits(profile?.activeShiftsCount ?: 8)} شیفت", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Business Info Card
            Text(text = "اطلاعات تماس و نشانی", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = Navy900, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "${profile?.city ?: "تهران"}، ${profile?.address ?: "سعادت‌آباد، میدان کاج"}", style = MaterialTheme.typography.bodyMedium)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Phone, contentDescription = null, tint = Navy900, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "تماس: ${profile?.contactInfo ?: "۰۲۱-۲۲۳۳۴۴۵۵"}", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Menu list
            KarvinCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 6.dp)) {
                    ProfileOptionRow(
                        title = "ویرایش اطلاعات کسب‌وکار",
                        icon = Icons.Default.Edit,
                        onClick = onNavigateToEditProfile
                    )
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    ProfileOptionRow(
                        title = "تنظیمات اپلیکیشن",
                        icon = Icons.Default.Settings,
                        onClick = onNavigateToSettings
                    )
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    ProfileOptionRow(
                        title = "پشتیبانی کارفرما",
                        icon = Icons.Default.Phone,
                        onClick = {}
                    )
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    ProfileOptionRow(
                        title = stringResource(id = R.string.logout),
                        icon = Icons.AutoMirrored.Filled.Logout,
                        tintColor = Red500,
                        onClick = { showLogoutDialog = true }
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
private fun ProfileOptionRow(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
    tintColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(imageVector = icon, contentDescription = null, tint = tintColor, modifier = Modifier.size(22.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(text = title, style = MaterialTheme.typography.bodyLarge, color = tintColor, fontWeight = FontWeight.Medium)
        }
        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = TextSecondaryLight, modifier = Modifier.size(16.dp))
    }
}

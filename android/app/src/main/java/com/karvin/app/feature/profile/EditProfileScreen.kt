package com.karvin.app.feature.profile

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationCity
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.karvin.app.core.designsystem.AppTopBar
import com.karvin.app.core.designsystem.Avatar
import com.karvin.app.core.designsystem.PrimaryButton
import com.karvin.app.domain.model.UserRole
import kotlinx.coroutines.launch

@Composable
fun EditProfileScreen(
    navController: NavHostController,
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val user = state.user
    val snackbarHostState = remember { SnackbarHostState() }

    var name by remember(user?.name) { mutableStateOf(user?.name.orEmpty()) }
    var phone by remember(user?.phone) { mutableStateOf(user?.phone.orEmpty()) }
    var city by remember(user?.city) { mutableStateOf(user?.city.orEmpty()) }
    var bio by remember(user?.bio) { mutableStateOf(user?.bio.orEmpty()) }
    var skillsText by remember(user?.skills) { mutableStateOf(user?.skills?.joinToString("، ").orEmpty()) }

    LaunchedEffect(state.updateSuccess) {
        if (state.updateSuccess) {
            snackbarHostState.showSnackbar("اطلاعات پروفایل با موفقیت ذخیره شد")
        }
    }

    Scaffold(
        topBar = {
            AppTopBar(
                title = if (user?.role == UserRole.PROVIDER) "اطلاعات متخصص" else "ویرایش مشخصات",
                onBack = { navController.popBackStack() },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    if (user != null) {
                        Avatar(user = user, size = 90.dp)
                    }
                }
            }

            if (user?.role == UserRole.PROVIDER) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                        shape = RoundedCornerShape(16.dp),
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Column {
                                Text("وضعیت احراز هویت: تایید شده", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                                Text("اطلاعات هویتی شما برای جلب اعتماد متقاضیان بررسی شده است.", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }

            item {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("نام و نام خانوادگی") },
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true,
                )
            }

            item {
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("شماره همراه") },
                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true,
                )
            }

            item {
                OutlinedTextField(
                    value = city,
                    onValueChange = { city = it },
                    label = { Text("شهر و محدوده فعالیت") },
                    leadingIcon = { Icon(Icons.Default.LocationCity, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true,
                )
            }

            if (user?.role == UserRole.PROVIDER) {
                item {
                    OutlinedTextField(
                        value = skillsText,
                        onValueChange = { skillsText = it },
                        label = { Text("مهارت‌ها و خدمات (با ویرگول جدا کنید)") },
                        leadingIcon = { Icon(Icons.Default.Work, contentDescription = null) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        placeholder = { Text("مثال: برق‌کاری، نصب لوستر، آیفون تصویری") },
                    )
                }
            }

            item {
                OutlinedTextField(
                    value = bio,
                    onValueChange = { bio = it },
                    label = { Text("درباره من و سوابق کاری") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    minLines = 3,
                    maxLines = 5,
                    placeholder = { Text("توضیحات مختصری درباره تجربه، گواهی‌نامه‌ها و ضمانت خدمات خود بنویسید.") },
                )
            }

            item {
                Spacer(Modifier.height(10.dp))
                PrimaryButton(
                    text = "ذخیره تغییرات",
                    onClick = {
                        val skillsList = skillsText.split("،", ",").map { it.trim() }.filter { it.isNotBlank() }
                        viewModel.updateProfile(
                            name = name,
                            city = city,
                            phone = phone,
                            bio = bio,
                            skills = skillsList,
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

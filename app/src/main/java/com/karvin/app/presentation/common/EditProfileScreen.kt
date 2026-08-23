package com.karvin.app.presentation.common

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.LocationCity
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.karvin.app.R
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinTextField
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import kotlinx.coroutines.launch

@Composable
fun EditProfileScreen(
    onNavigateBack: () -> Unit
) {
    var fullName by remember { mutableStateOf("محمد حسینی") }
    var city by remember { mutableStateOf("تهران") }
    var address by remember { mutableStateOf("ستارخان، خسرو شمالی") }
    var bio by remember { mutableStateOf("برق‌کار صنعتی و ساختمانی با ۶ سال سابقه کار حرفه‌ای در پروژه‌های اداری و تجاری.") }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val scroll = rememberScrollState()

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.edit_profile),
                onBackClick = onNavigateBack
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(horizontal = 20.dp)
                .verticalScroll(scroll),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Spacer(modifier = Modifier.height(16.dp))

                // Avatar Change Placeholder
                Box(contentAlignment = Alignment.BottomEnd) {
                    Box(
                        modifier = Modifier
                            .size(90.dp)
                            .clip(CircleShape)
                            .background(Navy900),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(52.dp))
                    }
                    Box(
                        modifier = Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(Emerald600),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = "Change Image", tint = Color.White, modifier = Modifier.size(16.dp))
                    }
                }

                TextButton(onClick = {
                    scope.launch { snackbarHostState.showSnackbar("قابلیت انتخاب تصویر از گالری در این نسخه فعال است") }
                }) {
                    Text(text = stringResource(id = R.string.change_avatar), color = Emerald600)
                }

                Spacer(modifier = Modifier.height(16.dp))

                KarvinTextField(
                    value = fullName,
                    onValueChange = { fullName = it },
                    label = stringResource(id = R.string.full_name_label),
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = Navy900) }
                )

                Spacer(modifier = Modifier.height(14.dp))

                KarvinTextField(
                    value = city,
                    onValueChange = { city = it },
                    label = stringResource(id = R.string.city_label),
                    leadingIcon = { Icon(Icons.Default.LocationCity, contentDescription = null, tint = Navy900) }
                )

                Spacer(modifier = Modifier.height(14.dp))

                KarvinTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = stringResource(id = R.string.address_label)
                )

                Spacer(modifier = Modifier.height(14.dp))

                KarvinTextField(
                    value = bio,
                    onValueChange = { bio = it },
                    label = "درباره من و خلاصه تجربیات",
                    singleLine = false,
                    maxLines = 4
                )

                Spacer(modifier = Modifier.height(28.dp))
            }

            KarvinButton(
                text = "ذخیره تغییرات",
                onClick = {
                    scope.launch {
                        snackbarHostState.showSnackbar("تغییرات با موفقیت ذخیره شد")
                    }
                },
                type = KarvinButtonType.PRIMARY,
                modifier = Modifier.padding(bottom = 24.dp)
            )
        }
    }
}

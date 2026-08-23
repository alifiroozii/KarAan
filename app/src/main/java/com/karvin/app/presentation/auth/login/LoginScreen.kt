package com.karvin.app.presentation.auth.login

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.domain.model.UserRole
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinLogo
import com.karvin.app.presentation.components.KarvinTextField
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight

@Composable
fun LoginScreen(
    onNavigateBack: () -> Unit,
    onNavigateToOtp: (String, String) -> Unit,
    onNavigateToRegister: (UserRole) -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(state.isOtpSent) {
        if (state.isOtpSent) {
            onNavigateToOtp(state.phoneNumber, state.role.name)
        }
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = if (state.role == UserRole.WORKER) "ورود کارگران" else "ورود کارفرمایان",
                onBackClick = onNavigateBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Spacer(modifier = Modifier.height(16.dp))

                KarvinLogo(
                    size = 72.dp,
                    showText = true,
                    showSlogan = false
                )

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "شماره همراه خود را وارد کنید",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "برای ورود یا ثبت‌نام، کد تایید برای شماره شما پیامک خواهد شد.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondaryLight,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(28.dp))

                KarvinTextField(
                    value = state.phoneNumber,
                    onValueChange = viewModel::onPhoneNumberChange,
                    label = stringResource(id = R.string.phone_number_label),
                    placeholder = "۰۹۱۲۳۴۵۶۷۸۹",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    isError = state.errorMessage != null,
                    errorMessage = state.errorMessage,
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.PhoneAndroid,
                            contentDescription = null,
                            tint = Navy900,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                )

                Spacer(modifier = Modifier.height(24.dp))

                KarvinButton(
                    text = stringResource(id = R.string.send_otp_btn),
                    onClick = viewModel::sendOtp,
                    type = if (state.role == UserRole.WORKER) KarvinButtonType.SECONDARY else KarvinButtonType.PRIMARY,
                    isLoading = state.isLoading
                )
            }

            // Quick Register switch
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "حساب کاربری جدید می‌سازید؟",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondaryLight
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    TextButton(onClick = { onNavigateToRegister(state.role) }) {
                        Text(
                            text = "ثبت‌نام مستقیم",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = if (state.role == UserRole.WORKER) Emerald600 else Navy900
                        )
                    }
                }
            }
        }
    }
}

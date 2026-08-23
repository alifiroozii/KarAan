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
import androidx.compose.material.icons.filled.Lock
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
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.karvin.app.R
import com.karvin.app.domain.model.UserRole
import com.karvin.app.presentation.components.KarvinButton
import com.karvin.app.presentation.components.KarvinButtonType
import com.karvin.app.presentation.components.KarvinTextField
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter

@Composable
fun OtpVerificationScreen(
    phoneNumber: String,
    role: String,
    onNavigateBack: () -> Unit,
    onLoginSuccess: (UserRole) -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(phoneNumber) {
        if (state.phoneNumber.isBlank()) {
            viewModel.onPhoneNumberChange(phoneNumber)
        }
    }

    LaunchedEffect(state.loginSuccessUser) {
        val user = state.loginSuccessUser
        if (user != null) {
            onLoginSuccess(user.role)
        }
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.otp_title),
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
                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    text = "کد تایید پیامک شده را وارد کنید",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "کد ۵ رقمی ارسال شده به شماره ${PersianDateFormatter.toPersianDigits(phoneNumber)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondaryLight,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(32.dp))

                KarvinTextField(
                    value = state.otpCode,
                    onValueChange = viewModel::onOtpCodeChange,
                    label = stringResource(id = R.string.otp_code_label),
                    placeholder = "۱۲۳۴۵ (کد نمونه: ۱۲۳۴۵)",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    isError = state.errorMessage != null,
                    errorMessage = state.errorMessage,
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null,
                            tint = Navy900,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Fast auto-fill button for testing
                TextButton(onClick = { viewModel.onOtpCodeChange("12345") }) {
                    Text(
                        text = "درج خودکار کد تایید تستی (۱۲۳۴۵)",
                        style = MaterialTheme.typography.bodySmall,
                        color = Emerald600,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                KarvinButton(
                    text = stringResource(id = R.string.verify_and_continue),
                    onClick = viewModel::verifyOtp,
                    type = if (state.role == UserRole.WORKER) KarvinButtonType.SECONDARY else KarvinButtonType.PRIMARY,
                    isLoading = state.isLoading
                )
            }

            // Resend code option
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                TextButton(onClick = viewModel::sendOtp) {
                    Text(
                        text = stringResource(id = R.string.resend_otp),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondaryLight
                    )
                }
            }
        }
    }
}

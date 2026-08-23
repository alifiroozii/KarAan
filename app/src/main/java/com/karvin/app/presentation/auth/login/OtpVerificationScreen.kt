package com.karvin.app.presentation.auth.login

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
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
import com.karvin.app.presentation.components.KarvinLogo
import com.karvin.app.presentation.components.KarvinTopAppBar
import com.karvin.app.presentation.theme.BorderLight
import com.karvin.app.presentation.theme.Emerald600
import com.karvin.app.presentation.theme.Navy900
import com.karvin.app.presentation.theme.TextSecondaryLight
import com.karvin.app.utils.PersianDateFormatter
import kotlinx.coroutines.delay

@Composable
fun OtpVerificationScreen(
    phoneNumber: String,
    role: String,
    onNavigateBack: () -> Unit,
    onLoginSuccess: (UserRole) -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val userRole = try { UserRole.valueOf(role) } catch (e: Exception) { UserRole.WORKER }

    // Countdown Timer (120s)
    var timeLeft by remember { mutableIntStateOf(120) }
    LaunchedEffect(key1 = timeLeft) {
        if (timeLeft > 0) {
            delay(1000L)
            timeLeft--
        }
    }

    LaunchedEffect(key1 = state.loginSuccess) {
        if (state.loginSuccess && state.currentUser != null) {
            onLoginSuccess(state.currentUser!!.role)
        }
    }

    LaunchedEffect(key1 = state.errorMessage) {
        state.errorMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            KarvinTopAppBar(
                title = stringResource(id = R.string.otp_title),
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
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Spacer(modifier = Modifier.height(24.dp))

                KarvinLogo(size = 72.dp)

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "کد تایید ۵ رقمی",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = stringResource(id = R.string.otp_sent_to, PersianDateFormatter.toPersianDigits(phoneNumber)),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondaryLight,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(32.dp))

                // 5 Individual Digit Boxes for OTP
                OtpInputBoxes(
                    code = state.otpCode,
                    onCodeChange = viewModel::onOtpCodeChange
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Test Autofill Helper Chip
                KarvinButton(
                    text = "کد تایید تستی (۱۲۳۴۵)",
                    onClick = {
                        viewModel.onOtpCodeChange("12345")
                    },
                    type = KarvinButtonType.OUTLINED,
                    modifier = Modifier.width(180.dp),
                    height = 36.dp,
                    shapeRadius = 20.dp
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Timer & Resend
                if (timeLeft > 0) {
                    val minutes = timeLeft / 60
                    val seconds = timeLeft % 60
                    val timeStr = "${PersianDateFormatter.toPersianDigits(minutes)}:${PersianDateFormatter.toPersianDigits(String.format("%02d", seconds))}"
                    Text(
                        text = "ارسال مجدد کد تا $timeStr دیگر",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondaryLight
                    )
                } else {
                    TextButton(onClick = {
                        timeLeft = 120
                        viewModel.onPhoneNumberChange(phoneNumber)
                        viewModel.sendOtp()
                    }) {
                        Text(
                            text = stringResource(id = R.string.resend_otp),
                            color = Emerald600,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Bottom Confirm Button
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(color = Navy900)
                } else {
                    KarvinButton(
                        text = stringResource(id = R.string.verify_and_continue),
                        onClick = { viewModel.verifyOtpAndLogin(phoneNumber, userRole) },
                        type = KarvinButtonType.PRIMARY,
                        enabled = state.otpCode.length == 5
                    )
                }
            }
        }
    }
}

@Composable
fun OtpInputBoxes(
    code: String,
    onCodeChange: (String) -> Unit
) {
    BasicTextField(
        value = code,
        onValueChange = {
            if (it.length <= 5 && it.all { char -> char.isDigit() }) {
                onCodeChange(it)
            }
        },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
        decorationBox = {
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                repeat(5) { index ->
                    val char = if (index < code.length) PersianDateFormatter.toPersianDigits(code[index].toString()) else ""
                    val isFocused = index == code.length

                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .border(
                                width = if (isFocused) 2.dp else 1.dp,
                                color = if (isFocused) Navy900 else BorderLight,
                                shape = RoundedCornerShape(12.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = char,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Navy900,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    )
}

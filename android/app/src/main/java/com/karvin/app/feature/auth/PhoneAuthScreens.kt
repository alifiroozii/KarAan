package com.karvin.app.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.filled.Engineering
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Security
import com.karvin.app.core.designsystem.KarjoorColors
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.karvin.app.core.designsystem.KarjoorMark
import com.karvin.app.core.designsystem.PrimaryButton
import com.karvin.app.domain.model.toPersianDigits

@Composable
fun LoginScreen(
    onOtpSent: (String) -> Unit,
    onAuthenticated: (com.karvin.app.domain.model.UserRole) -> Unit = {},
    viewModel: PhoneAuthViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var phone by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }
    var selectedRole by remember { mutableStateOf(com.karvin.app.domain.model.UserRole.REQUESTER) }

    LaunchedEffect(state.otpSent) {
        if (state.otpSent) {
            onOtpSent(phone)
        }
    }

    AuthContainer(
        title = "ورود و ثبت‌نام در کارجور",
        subtitle = "ثبت‌نام و ورود سریع فقط با شماره موبایل (بدون نیاز به تایید پیامکی)",
        icon = { KarjoorMark(size = 46.dp) },
    ) {
        // Free Service Notice Banner
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f),
            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)),
            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp),
        ) {
            Row(
                modifier = Modifier.padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(
                    Icons.Default.Security,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = "سرویس کارجور کاملاً رایگان است (۰٪ کارمزد)",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }

        // Role Selector Pills (Google Stitch Segmented Style)
        Text("نقش شما در سامانه:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            val isReq = selectedRole == com.karvin.app.domain.model.UserRole.REQUESTER
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = if (isReq) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isReq) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                ),
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable { selectedRole = com.karvin.app.domain.model.UserRole.REQUESTER },
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(
                        Icons.Default.BusinessCenter,
                        contentDescription = null,
                        tint = if (isReq) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        "کارفرما",
                        fontSize = 12.sp,
                        fontWeight = if (isReq) FontWeight.Bold else FontWeight.Medium,
                        color = if (isReq) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                    )
                }
            }

            val isProv = selectedRole == com.karvin.app.domain.model.UserRole.PROVIDER
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = if (isProv) KarjoorColors.Secondary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isProv) KarjoorColors.Secondary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                ),
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable { selectedRole = com.karvin.app.domain.model.UserRole.PROVIDER },
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(
                        Icons.Default.Engineering,
                        contentDescription = null,
                        tint = if (isProv) KarjoorColors.Secondary else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        "متخصص",
                        fontSize = 12.sp,
                        fontWeight = if (isProv) FontWeight.Bold else FontWeight.Medium,
                        color = if (isProv) KarjoorColors.Secondary else MaterialTheme.colorScheme.onSurface,
                    )
                }
            }
        }

        Spacer(Modifier.height(4.dp))

        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("شماره موبایل *") },
            placeholder = { Text("۰۹۱۲۳۴۵۶۷۸۹") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            isError = state.error != null,
        )

        OutlinedTextField(
            value = fullName,
            onValueChange = { fullName = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("نام و نام خانوادگی (اختیاری)") },
            placeholder = { Text("مثال: علی فیروزی") },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
        )

        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(Modifier.height(6.dp))

        // Direct Mobile Login Button (No OTP verification needed!)
        PrimaryButton(
            text = if (state.isLoading) "در حال اتصال به سامانه..." else "ورود مستقیم و سریع به برنامه",
            onClick = {
                viewModel.directPhoneLogin(
                    phone = phone,
                    fullName = fullName,
                    role = selectedRole,
                    onSuccess = { role ->
                        onAuthenticated(role)
                    }
                )
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.isLoading && phone.isNotBlank(),
        )
    }
}

@Composable
fun OtpScreen(
    phone: String,
    onAuthenticated: () -> Unit,
    viewModel: PhoneAuthViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val remaining by viewModel.remainingSeconds.collectAsStateWithLifecycle()
    var code by remember { mutableStateOf(List(5) { "" }) }
    val requesters = remember { List(5) { FocusRequester() } }

    LaunchedEffect(state.authenticated) {
        if (state.authenticated) {
            onAuthenticated()
        }
    }

    AuthContainer(
        title = "تایید شماره موبایل",
        subtitle = "کد ۵ رقمی ارسال‌شده به ${phone.toPersianDigits()} را وارد کنید.",
        icon = { Icon(Icons.Default.Security, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(36.dp)) },
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            code.forEachIndexed { index, value ->
                OutlinedTextField(
                    value = value,
                    onValueChange = { input ->
                        val digit = input.filter(Char::isDigit).takeLast(1)
                        code = code.toMutableList().also { it[index] = digit }
                        if (digit.isNotEmpty() && index < 4) {
                            requesters[index + 1].requestFocus()
                        }
                    },
                    modifier = Modifier
                        .weight(1f)
                        .focusRequester(requesters[index]),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    maxLines = 1,
                    shape = RoundedCornerShape(12.dp),
                )
            }
        }

        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(Modifier.height(8.dp))

        PrimaryButton(
            text = if (state.isLoading) "در حال بررسی..." else "تایید و ورود",
            onClick = { viewModel.verifyOtp(phone, code.joinToString("")) },
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.isLoading && code.all { it.isNotEmpty() },
        )

        val timerText = if (remaining > 0) {
            "ارسال مجدد تا ${(remaining / 60).toString().toPersianDigits()}:${(remaining % 60).toString().padStart(2, '0').toPersianDigits()}"
        } else {
            "ارسال مجدد پیامک"
        }

        TextButton(
            onClick = { viewModel.resendOtp(phone) },
            enabled = remaining == 0,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(timerText)
        }
    }
}

@Composable
private fun AuthContainer(
    title: String,
    subtitle: String,
    icon: @Composable () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.size(72.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        icon()
                    }
                }

                Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)

                content()
            }
        }
    }
}

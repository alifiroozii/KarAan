package com.karvin.app.feature.auth

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Security
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
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
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
    var showGmailDialog by remember { mutableStateOf(false) }

    var gmailEmail by remember { mutableStateOf("alifiroozi.dev@gmail.com") }
    var gmailName by remember { mutableStateOf("علی فیروزی") }
    var gmailRole by remember { mutableStateOf(com.karvin.app.domain.model.UserRole.PROVIDER) }

    LaunchedEffect(state.otpSent) {
        if (state.otpSent) {
            onOtpSent(phone)
        }
    }

    AuthContainer(
        title = "ورود به کارجور",
        subtitle = "جهت هماهنگی با سامانه، با شماره موبایل یا جیمیل وارد شوید.",
        icon = { Icon(Icons.Default.Phone, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(36.dp)) },
    ) {
        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("شماره موبایل") },
            placeholder = { Text("۰۹۱۲۳۴۵۶۷۸۹") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            isError = state.error != null,
        )

        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(Modifier.height(4.dp))

        PrimaryButton(
            text = if (state.isLoading) "در حال ارسال..." else "دریافت کد تایید پیامکی",
            onClick = { viewModel.sendOtp(phone) },
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.isLoading && phone.isNotBlank(),
        )

        Spacer(Modifier.height(8.dp))

        // Divider
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Box(Modifier.weight(1f).height(1.dp).background(MaterialTheme.colorScheme.outlineVariant))
            Text("یا", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Box(Modifier.weight(1f).height(1.dp).background(MaterialTheme.colorScheme.outlineVariant))
        }

        Spacer(Modifier.height(4.dp))

        // Gmail Login Button
        androidx.compose.material3.OutlinedButton(
            onClick = { showGmailDialog = true },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, androidx.compose.ui.graphics.Color(0xFFEA4335)),
            colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                contentColor = androidx.compose.ui.graphics.Color(0xFFEA4335),
            ),
        ) {
            Text("ورود با حساب گوگل (Gmail)", fontWeight = FontWeight.Bold)
        }
    }

    if (showGmailDialog) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showGmailDialog = false },
            title = {
                Text(
                    text = "ورود با حساب گوگل (Gmail)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "اطلاعات شما پس از ورود بلافاصله با داشبورد مدیریت Next.js هماهنگ می‌شود:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    OutlinedTextField(
                        value = gmailEmail,
                        onValueChange = { gmailEmail = it },
                        label = { Text("آدرس جیمیل (Gmail)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                    )

                    OutlinedTextField(
                        value = gmailName,
                        onValueChange = { gmailName = it },
                        label = { Text("نام و نام خانوادگی") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                    )

                    Text("نقش شما در سامانه:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        androidx.compose.material3.FilterChip(
                            selected = gmailRole == com.karvin.app.domain.model.UserRole.PROVIDER,
                            onClick = { gmailRole = com.karvin.app.domain.model.UserRole.PROVIDER },
                            label = { Text("متخصص و کارجو", fontSize = androidx.compose.ui.unit.TextUnit(11f, androidx.compose.ui.unit.TextUnitType.Sp)) },
                            modifier = Modifier.weight(1f),
                        )
                        androidx.compose.material3.FilterChip(
                            selected = gmailRole == com.karvin.app.domain.model.UserRole.REQUESTER,
                            onClick = { gmailRole = com.karvin.app.domain.model.UserRole.REQUESTER },
                            label = { Text("کارفرما / ثبت کار", fontSize = androidx.compose.ui.unit.TextUnit(11f, androidx.compose.ui.unit.TextUnitType.Sp)) },
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showGmailDialog = false
                        viewModel.loginWithGmail(
                            email = gmailEmail,
                            fullName = gmailName,
                            role = gmailRole,
                            phone = if (phone.isNotBlank()) phone else "09121112233",
                            onSuccess = { role ->
                                onAuthenticated(role)
                            },
                        )
                    },
                    shape = RoundedCornerShape(10.dp),
                ) {
                    Text("تأیید و ورود")
                }
            },
            dismissButton = {
                TextButton(onClick = { showGmailDialog = false }) {
                    Text("انصراف")
                }
            },
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

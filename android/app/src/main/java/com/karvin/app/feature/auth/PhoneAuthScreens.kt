package com.karvin.app.feature.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun LoginScreen(onOtpSent: (String) -> Unit, viewModel: PhoneAuthViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var phone by remember { mutableStateOf("") }
    AuthContainer(title = "ورود به کاروین") {
        OutlinedTextField(phone, { phone = it }, modifier = Modifier.fillMaxWidth(), label = { Text("شماره موبایل") }, placeholder = { Text("09123456789") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), singleLine = true, isError = state.error != null)
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(onClick = { viewModel.sendOtp(phone); if (phone.matches(Regex("09\\d{9}"))) onOtpSent(phone) }, modifier = Modifier.fillMaxWidth(), enabled = !state.isLoading) { if (state.isLoading) CircularProgressIndicator(Modifier.size(20.dp)) else Text("دریافت کد تایید") }
    }
}

@Composable
fun OtpScreen(phone: String, onAuthenticated: () -> Unit, viewModel: PhoneAuthViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val remaining by viewModel.remainingSeconds.collectAsStateWithLifecycle()
    var code by remember { mutableStateOf(List(5) { "" }) }
    val requesters = remember { List(5) { FocusRequester() } }
    AuthContainer(title = "تایید شماره موبایل") {
        Text("کد ارسال‌شده به $phone را وارد کنید.")
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) { code.forEachIndexed { index, value -> OutlinedTextField(value, { input -> val digit = input.filter(Char::isDigit).takeLast(1); code = code.toMutableList().also { it[index] = digit }; if (digit.isNotEmpty() && index < 4) requesters[index + 1].requestFocus() }, modifier = Modifier.weight(1f).focusRequester(requesters[index]), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, maxLines = 1) } }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(onClick = { viewModel.verifyOtp(phone, code.joinToString("")); if (code.all { it.isNotEmpty() }) onAuthenticated() }, modifier = Modifier.fillMaxWidth(), enabled = !state.isLoading) { Text("تایید و ورود") }
        TextButton(onClick = { viewModel.resendOtp(phone) }, enabled = remaining == 0) { Text(if (remaining > 0) "ارسال مجدد تا ${remaining / 60}:${(remaining % 60).toString().padStart(2, '0')}" else "ارسال مجدد پیامک") }
    }
}

@Composable
private fun AuthContainer(title: String, content: @Composable ColumnScope.() -> Unit) { Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically)) { Text(title, style = MaterialTheme.typography.headlineSmall); content() } }

package com.karvin.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.core.common.ApiResult
import com.karvin.app.core.session.SessionManager
import com.karvin.app.domain.repository.PhoneAuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PhoneAuthUiState(val isLoading: Boolean = false, val error: String? = null, val otpSent: Boolean = false, val authenticated: Boolean = false)

@HiltViewModel
class PhoneAuthViewModel @Inject constructor(private val repository: PhoneAuthRepository, private val sessionManager: SessionManager) : ViewModel() {
    private val _state = MutableStateFlow(PhoneAuthUiState())
    val state: StateFlow<PhoneAuthUiState> = _state.asStateFlow()
    private val _remainingSeconds = MutableStateFlow(0)
    val remainingSeconds: StateFlow<Int> = _remainingSeconds.asStateFlow()
    private var timerJob: Job? = null

    fun sendOtp(phone: String) {
        val normalized = phone.toEnglishDigits()
        if (!IRAN_PHONE.matches(normalized)) { _state.value = _state.value.copy(error = "شماره موبایل باید با 09 شروع شده و 11 رقم باشد."); return }
        viewModelScope.launch { _state.value = PhoneAuthUiState(isLoading = true); _state.value = when (val result = repository.sendOtp(normalized)) { is ApiResult.Success -> { startTimer(); PhoneAuthUiState(otpSent = true) }; is ApiResult.Error -> PhoneAuthUiState(error = result.message); ApiResult.Loading -> PhoneAuthUiState(isLoading = true) } }
    }

    fun verifyOtp(phone: String, code: String) {
        val normalizedCode = code.toEnglishDigits()
        if (!OTP.matches(normalizedCode)) { _state.value = _state.value.copy(error = "کد تایید باید ۵ رقم باشد."); return }
        viewModelScope.launch { _state.value = _state.value.copy(isLoading = true, error = null); _state.value = when (val result = repository.verifyOtp(phone.toEnglishDigits(), normalizedCode)) { is ApiResult.Success -> { sessionManager.setSession(result.data.token, result.data.role); timerJob?.cancel(); _remainingSeconds.value = 0; PhoneAuthUiState(authenticated = true) }; is ApiResult.Error -> PhoneAuthUiState(error = result.message); ApiResult.Loading -> PhoneAuthUiState(isLoading = true) } }
    }

    fun resendOtp(phone: String) { if (_remainingSeconds.value == 0) sendOtp(phone) }

    fun directPhoneLogin(
        phone: String,
        fullName: String = "",
        role: com.karvin.app.domain.model.UserRole = com.karvin.app.domain.model.UserRole.REQUESTER,
        onSuccess: (com.karvin.app.domain.model.UserRole) -> Unit = {},
    ) {
        val normalized = phone.toEnglishDigits().trim()
        if (normalized.length < 10) {
            _state.value = _state.value.copy(error = "لطفاً شماره موبایل معتبر (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.")
            return
        }
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val sessionToken = "session_phone_${normalized}_${System.currentTimeMillis()}"
            sessionManager.setSession(sessionToken, role)
            com.karvin.app.core.network.MobileDashboardSync.activeToken = sessionToken

            // Sync user session and audit event immediately to Vercel dashboard and DB
            com.karvin.app.core.network.MobileDashboardSync.syncUserSession(
                fullName = fullName.ifBlank { "کاربر $normalized" },
                phone = normalized,
                role = if (role == com.karvin.app.domain.model.UserRole.PROVIDER) "WORKER" else "EMPLOYER"
            )

            _state.value = PhoneAuthUiState(authenticated = true)
            onSuccess(role)
        }
    }

    fun loginWithGmail(
        email: String,
        fullName: String,
        role: com.karvin.app.domain.model.UserRole,
        phone: String = "",
        onSuccess: (com.karvin.app.domain.model.UserRole) -> Unit = {},
    ) {
        viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val roleString = if (role == com.karvin.app.domain.model.UserRole.PROVIDER) "WORKER" else "EMPLOYER"
            val fallbackPhone = if (phone.isNotBlank()) phone else "0999" + (1000000..9999999).random()
            var sessionToken = "sess_android_gmail_" + java.util.UUID.randomUUID().toString()

            val jsonBody = org.json.JSONObject().apply {
                put("email", email.trim().lowercase())
                put("fullName", fullName.trim().ifEmpty { email.substringBefore("@") })
                put("role", roleString)
                put("phone", fallbackPhone)
                put("platform", "ANDROID")
                put("deviceModel", "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL} (${android.os.Build.DEVICE})")
                put("appVersion", "KARJOOR v2.4.0 (Build 42)")
            }

            // Sync with live Vercel production server first, with local fallbacks
            val urls = listOf(
                "https://kar-aan.vercel.app/api/auth/gmail",
                "http://10.0.2.2:3000/api/auth/gmail",
                "http://127.0.0.1:3000/api/auth/gmail"
            )

            for (urlStr in urls) {
                try {
                    val url = java.net.URL(urlStr)
                    val conn = (url.openConnection() as java.net.HttpURLConnection).apply {
                        requestMethod = "POST"
                        setRequestProperty("Content-Type", "application/json; charset=utf-8")
                        setRequestProperty("Accept", "application/json")
                        doOutput = true
                        connectTimeout = 3000
                        readTimeout = 3000
                    }
                    conn.outputStream.use { os ->
                        val input = jsonBody.toString().toByteArray(java.nio.charset.StandardCharsets.UTF_8)
                        os.write(input, 0, input.size)
                    }
                    if (conn.responseCode in 200..299) {
                        val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                        val respJson = org.json.JSONObject(responseText)
                        if (respJson.optBoolean("success")) {
                            val tok = respJson.optJSONObject("data")?.optString("token")
                            if (!tok.isNullOrBlank()) sessionToken = tok
                        }
                    }
                } catch (_: Exception) {
                    // Proceed with other endpoints in the sync list
                }
            }

            sessionManager.setSession(sessionToken, role)
            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                _state.value = PhoneAuthUiState(authenticated = true)
                onSuccess(role)
            }
        }
    }

    private fun startTimer() { timerJob?.cancel(); timerJob = viewModelScope.launch { _remainingSeconds.value = 120; while (_remainingSeconds.value > 0) { delay(1000); _remainingSeconds.value-- } } }
    private fun String.toEnglishDigits() = map { char ->
        when (char) {
            in '۰'..'۹' -> (char - '۰').toString()
            in '٠'..'٩' -> (char - '٠').toString()
            else -> char.toString()
        }
    }.joinToString("")
    private companion object { val IRAN_PHONE = Regex("09\\d{9}"); val OTP = Regex("\\d{5}") }
}

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

    private fun startTimer() { timerJob?.cancel(); timerJob = viewModelScope.launch { _remainingSeconds.value = 120; while (_remainingSeconds.value > 0) { delay(1000); _remainingSeconds.value-- } } }
    private fun String.toEnglishDigits() = map { "۰۱۲۳۴۵۶۷۸۹".indexOf(it).takeIf { index -> index >= 0 }?.toString() ?: it.toString() }.joinToString("")
    private companion object { val IRAN_PHONE = Regex("09\\d{9}"); val OTP = Regex("\\d{5}") }
}

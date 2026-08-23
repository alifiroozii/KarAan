package com.karvin.app.presentation.auth.login

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.usecase.auth.LoginWithOtpUseCase
import com.karvin.app.domain.usecase.auth.SendOtpUseCase
import com.karvin.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val phoneNumber: String = "",
    val otpCode: String = "",
    val role: UserRole = UserRole.WORKER,
    val isLoading: Boolean = false,
    val isOtpSent: Boolean = false,
    val loginSuccessUser: User? = null,
    val errorMessage: String? = null,
    val navigateToRegistration: Boolean = false
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val sendOtpUseCase: SendOtpUseCase,
    private val loginWithOtpUseCase: LoginWithOtpUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    init {
        val roleStr = savedStateHandle.get<String>("role")
        val role = try {
            if (roleStr != null) UserRole.valueOf(roleStr) else UserRole.WORKER
        } catch (e: Exception) {
            UserRole.WORKER
        }
        _uiState.value = _uiState.value.copy(role = role)
    }

    fun onPhoneNumberChange(phone: String) {
        _uiState.value = _uiState.value.copy(phoneNumber = phone, errorMessage = null)
    }

    fun onOtpCodeChange(code: String) {
        if (code.length <= 5) {
            _uiState.value = _uiState.value.copy(otpCode = code, errorMessage = null)
        }
    }

    fun sendOtp() {
        val phone = _uiState.value.phoneNumber
        if (phone.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "لطفاً شماره همراه خود را وارد کنید")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val result = sendOtpUseCase(phone)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, isOtpSent = true)
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = result.message)
                }
                else -> Unit
            }
        }
    }

    fun verifyOtp() {
        val state = _uiState.value
        if (state.otpCode.length < 5) {
            _uiState.value = _uiState.value.copy(errorMessage = "کد تایید باید ۵ رقم باشد")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val result = loginWithOtpUseCase(state.phoneNumber, state.otpCode, state.role)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, loginSuccessUser = result.data)
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = result.message)
                }
                else -> Unit
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}

package com.karvin.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.core.common.ApiResult
import com.karvin.app.core.session.SessionManager
import com.karvin.app.data.remote.LoginResponse
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.repository.NetworkAuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface NetworkAuthUiState {
    data object Idle : NetworkAuthUiState
    data object Loading : NetworkAuthUiState
    data object OtpSent : NetworkAuthUiState
    data class Authenticated(val response: LoginResponse) : NetworkAuthUiState
    data class Error(val message: String) : NetworkAuthUiState
}

@HiltViewModel
class NetworkAuthViewModel @Inject constructor(
    private val repository: NetworkAuthRepository,
    private val sessionManager: SessionManager,
) : ViewModel() {
    private val _state = MutableStateFlow<NetworkAuthUiState>(NetworkAuthUiState.Idle)
    val state: StateFlow<NetworkAuthUiState> = _state.asStateFlow()

    fun sendOtp(phone: String) {
        if (phone.filter(Char::isDigit).length < 10) {
            _state.value = NetworkAuthUiState.Error("شماره موبایل را کامل وارد کنید.")
            return
        }
        viewModelScope.launch {
            _state.value = NetworkAuthUiState.Loading
            _state.value = when (val result = repository.sendOtp(phone)) {
                is ApiResult.Success -> NetworkAuthUiState.OtpSent
                is ApiResult.Error -> NetworkAuthUiState.Error(result.message)
                ApiResult.Loading -> NetworkAuthUiState.Loading
            }
        }
    }

    fun verifyOtp(phone: String, code: String) {
        if (code.length < 4) {
            _state.value = NetworkAuthUiState.Error("کد تأیید را کامل وارد کنید.")
            return
        }
        viewModelScope.launch {
            _state.value = NetworkAuthUiState.Loading
            _state.value = when (val result = repository.verifyOtp(phone, code)) {
                is ApiResult.Success -> {
                    val role = result.data.role.toUserRole()
                    sessionManager.setSession(result.data.token, role)
                    NetworkAuthUiState.Authenticated(result.data)
                }
                is ApiResult.Error -> NetworkAuthUiState.Error(result.message)
                ApiResult.Loading -> NetworkAuthUiState.Loading
            }
        }
    }

    private fun String.toUserRole(): UserRole = when (uppercase()) {
        "PROVIDER", "WORKER" -> UserRole.PROVIDER
        else -> UserRole.REQUESTER
    }
}

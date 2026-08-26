package com.karvin.app.feature.auth

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.data.PreferencesStore
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface AuthUiState {
    data object Loading : AuthUiState
    data class Ready(val onboardingCompleted: Boolean, val role: UserRole?, val authenticated: Boolean) : AuthUiState
    data class Error(val message: String) : AuthUiState
}

sealed interface AuthEvent {
    data class SignIn(val phone: String) : AuthEvent
    data class SelectRole(val role: UserRole) : AuthEvent
    data object CompleteOnboarding : AuthEvent
    data object SignOut : AuthEvent
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val preferences: PreferencesStore,
) : ViewModel() {
    private val _state = MutableStateFlow<AuthUiState>(AuthUiState.Loading)
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            kotlinx.coroutines.flow.combine(
                preferences.onboardingCompleted,
                preferences.role,
                preferences.isAuthenticated,
            ) { onboarding, role, authenticated -> AuthUiState.Ready(onboarding, role, authenticated) }
                .collect { _state.value = it }
        }
    }

    fun onEvent(event: AuthEvent) {
        viewModelScope.launch {
            when (event) {
                is AuthEvent.SignIn -> {
                    if (event.phone.filter(Char::isDigit).length < 10) {
                        _state.value = AuthUiState.Error("شماره موبایل را کامل وارد کنید.")
                    } else {
                        when (val result = authRepository.signIn(event.phone)) {
                            is AppResult.Error -> _state.value = AuthUiState.Error(result.message)
                            else -> Unit
                        }
                    }
                }
                is AuthEvent.SelectRole -> authRepository.setRole(event.role)
                AuthEvent.CompleteOnboarding -> preferences.setOnboardingCompleted(true)
                AuthEvent.SignOut -> authRepository.signOut()
            }
        }
    }
}

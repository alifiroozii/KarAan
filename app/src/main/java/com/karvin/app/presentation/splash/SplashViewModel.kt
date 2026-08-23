package com.karvin.app.presentation.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.data.local.PreferencesManager
import com.karvin.app.domain.model.UserRole
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class SplashDestination {
    object Idle : SplashDestination()
    object RoleSelection : SplashDestination()
    object WorkerHome : SplashDestination()
    object EmployerDashboard : SplashDestination()
}

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val preferencesManager: PreferencesManager
) : ViewModel() {

    private val _destination = MutableStateFlow<SplashDestination>(SplashDestination.Idle)
    val destination: StateFlow<SplashDestination> = _destination.asStateFlow()

    init {
        checkAuthState()
    }

    private fun checkAuthState() {
        viewModelScope.launch {
            delay(1800) // Brief branded splash animation
            val isLoggedIn = preferencesManager.isLoggedInFlow.first()
            val userRole = preferencesManager.userRoleFlow.first()

            if (isLoggedIn) {
                when (userRole) {
                    UserRole.WORKER -> _destination.value = SplashDestination.WorkerHome
                    UserRole.EMPLOYER -> _destination.value = SplashDestination.EmployerDashboard
                    UserRole.NONE -> _destination.value = SplashDestination.RoleSelection
                }
            } else {
                _destination.value = SplashDestination.RoleSelection
            }
        }
    }
}

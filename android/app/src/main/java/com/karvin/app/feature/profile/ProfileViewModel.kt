package com.karvin.app.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karvin.app.data.PreferencesStore
import com.karvin.app.domain.model.AppResult
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(val loading: Boolean = true, val user: User? = null, val themeMode: String = "system", val error: String? = null)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val preferences: PreferencesStore,
) : ViewModel() {
    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()
    init {
        viewModelScope.launch { kotlinx.coroutines.flow.combine(authRepository.currentUser, preferences.themeMode) { user, theme -> ProfileUiState(false, user, theme) }.collect { _state.value = it } }
    }
    fun setTheme(mode: String) { viewModelScope.launch { preferences.setThemeMode(mode) } }
    fun setRole(role: UserRole) { viewModelScope.launch { authRepository.setRole(role) } }
    fun signOut() { viewModelScope.launch { authRepository.signOut() } }
}

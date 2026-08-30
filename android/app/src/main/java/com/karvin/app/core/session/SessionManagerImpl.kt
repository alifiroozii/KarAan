package com.karvin.app.core.session

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.karvin.app.core.security.SecureTokenStore
import com.karvin.app.domain.model.UserRole
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

private val Context.sessionDataStore by preferencesDataStore(name = "karvin_session")

@Singleton
class SessionManagerImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val secureTokenStore: SecureTokenStore,
) : SessionManager {
    private val _state = MutableStateFlow(SessionState())
    override val state: StateFlow<SessionState> = _state.asStateFlow()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    init {
        scope.launch {
            context.sessionDataStore.data
                .catch { emit(androidx.datastore.preferences.core.emptyPreferences()) }
                .map { preferences ->
                    val secureToken = secureTokenStore.get()
                    val role = preferences[ROLE_KEY]?.let { value ->
                        runCatching { UserRole.valueOf(value) }.getOrNull()
                    }
                    SessionState(
                        isLoading = false,
                        isLoggedIn = !secureToken.isNullOrBlank(),
                        token = secureToken,
                        role = role,
                    )
                }
                .collect { _state.value = it }
        }
    }

    override suspend fun setSession(token: String, role: UserRole) {
        secureTokenStore.save(token)
        context.sessionDataStore.edit {
            it[ROLE_KEY] = role.name
        }
        _state.value = SessionState(isLoading = false, isLoggedIn = true, token = token, role = role)
    }

    override suspend fun setRole(role: UserRole) {
        context.sessionDataStore.edit { it[ROLE_KEY] = role.name }
        _state.value = _state.value.copy(role = role)
    }

    override suspend fun clearSession() {
        secureTokenStore.clear()
        context.sessionDataStore.edit {
            it.remove(ROLE_KEY)
        }
        _state.value = SessionState(isLoading = false, isLoggedIn = false, token = null, role = null)
    }

    private companion object {
        val ROLE_KEY = stringPreferencesKey("role")
    }
}


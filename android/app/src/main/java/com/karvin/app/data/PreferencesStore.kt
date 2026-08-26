package com.karvin.app.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.karvin.app.domain.model.UserRole
import com.karvin.app.domain.repository.UserPreferencesRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.karvinDataStore by preferencesDataStore(name = "karvin_preferences")

class PreferencesStore(private val context: Context) : UserPreferencesRepository {
    private object Keys {
        val onboardingCompleted = booleanPreferencesKey("onboarding_completed")
        val role = stringPreferencesKey("role")
        val themeMode = stringPreferencesKey("theme_mode")
        val userName = stringPreferencesKey("user_name")
        val authenticated = booleanPreferencesKey("authenticated")
    }

    override val onboardingCompleted: Flow<Boolean> = context.karvinDataStore.data
        .map { it[Keys.onboardingCompleted] ?: false }

    override val themeMode: Flow<String> = context.karvinDataStore.data
        .map { it[Keys.themeMode] ?: "system" }

    val role: Flow<UserRole?> = context.karvinDataStore.data.map { prefs ->
        prefs[Keys.role]?.let { value -> runCatching { UserRole.valueOf(value) }.getOrNull() }
    }

    val userName: Flow<String> = context.karvinDataStore.data.map { it[Keys.userName] ?: "مهمان" }

    val isAuthenticated: Flow<Boolean> = context.karvinDataStore.data
        .map { it[Keys.authenticated] ?: false }

    override suspend fun setOnboardingCompleted(completed: Boolean) {
        context.karvinDataStore.edit { it[Keys.onboardingCompleted] = completed }
    }

    suspend fun setRole(role: UserRole?) {
        context.karvinDataStore.edit {
            if (role == null) it.remove(Keys.role) else it[Keys.role] = role.name
        }
    }

    override suspend fun setThemeMode(mode: String) {
        context.karvinDataStore.edit { it[Keys.themeMode] = mode }
    }

    suspend fun setUserName(name: String) {
        context.karvinDataStore.edit { it[Keys.userName] = name }
    }

    suspend fun setAuthenticated(authenticated: Boolean) {
        context.karvinDataStore.edit { it[Keys.authenticated] = authenticated }
    }
}

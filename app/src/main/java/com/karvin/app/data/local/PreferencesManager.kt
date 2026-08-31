package com.karvin.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.karvin.app.domain.model.UserRole
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "karvin_preferences")

@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val KEY_USER_ROLE = stringPreferencesKey("user_role")
        private val KEY_AUTH_TOKEN = stringPreferencesKey("auth_token")
        private val KEY_USER_ID = stringPreferencesKey("user_id")
        private val KEY_PHONE_NUMBER = stringPreferencesKey("phone_number")
        private val KEY_IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        private val KEY_DARK_MODE = booleanPreferencesKey("dark_mode")
    }

    private val safePreferencesFlow: Flow<Preferences> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                emit(emptyPreferences())
            }
        }

    val userRoleFlow: Flow<UserRole> = safePreferencesFlow.map { preferences ->
        val roleStr = preferences[KEY_USER_ROLE] ?: UserRole.NONE.name
        try {
            UserRole.valueOf(roleStr)
        } catch (e: Exception) {
            UserRole.NONE
        }
    }

    val isLoggedInFlow: Flow<Boolean> = safePreferencesFlow.map { preferences ->
        preferences[KEY_IS_LOGGED_IN] ?: false
    }

    val userIdFlow: Flow<String?> = safePreferencesFlow.map { preferences ->
        preferences[KEY_USER_ID]
    }

    val darkModeFlow: Flow<Boolean> = safePreferencesFlow.map { preferences ->
        preferences[KEY_DARK_MODE] ?: false
    }

    suspend fun setUserRole(role: UserRole) {
        try {
            context.dataStore.edit { preferences ->
                preferences[KEY_USER_ROLE] = role.name
            }
        } catch (e: Exception) {
            // Ignore failure gracefully
        }
    }

    suspend fun saveAuthSession(userId: String, phoneNumber: String, role: UserRole, token: String? = null) {
        try {
            context.dataStore.edit { preferences ->
                preferences[KEY_USER_ID] = userId
                preferences[KEY_PHONE_NUMBER] = phoneNumber
                preferences[KEY_USER_ROLE] = role.name
                preferences[KEY_IS_LOGGED_IN] = true
                if (token != null) {
                    preferences[KEY_AUTH_TOKEN] = token
                }
            }
        } catch (e: Exception) {
            // Ignore failure gracefully
        }
    }

    suspend fun setDarkMode(enabled: Boolean) {
        try {
            context.dataStore.edit { preferences ->
                preferences[KEY_DARK_MODE] = enabled
            }
        } catch (e: Exception) {
            // Ignore failure gracefully
        }
    }

    suspend fun clearSession() {
        try {
            context.dataStore.edit { preferences ->
                preferences.remove(KEY_USER_ID)
                preferences.remove(KEY_PHONE_NUMBER)
                preferences.remove(KEY_AUTH_TOKEN)
                preferences[KEY_IS_LOGGED_IN] = false
                preferences[KEY_USER_ROLE] = UserRole.NONE.name
            }
        } catch (e: Exception) {
            // Ignore failure gracefully
        }
    }
}

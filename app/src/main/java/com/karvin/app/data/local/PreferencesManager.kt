package com.karvin.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.karvin.app.domain.model.UserRole
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
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

    val userRoleFlow: Flow<UserRole> = context.dataStore.data.map { preferences ->
        val roleStr = preferences[KEY_USER_ROLE] ?: UserRole.NONE.name
        try {
            UserRole.valueOf(roleStr)
        } catch (e: Exception) {
            UserRole.NONE
        }
    }

    val isLoggedInFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_IS_LOGGED_IN] ?: false
    }

    val userIdFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_USER_ID]
    }

    val darkModeFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_DARK_MODE] ?: false
    }

    suspend fun setUserRole(role: UserRole) {
        context.dataStore.edit { preferences ->
            preferences[KEY_USER_ROLE] = role.name
        }
    }

    suspend fun saveAuthSession(userId: String, phoneNumber: String, role: UserRole, token: String? = null) {
        context.dataStore.edit { preferences ->
            preferences[KEY_USER_ID] = userId
            preferences[KEY_PHONE_NUMBER] = phoneNumber
            preferences[KEY_USER_ROLE] = role.name
            preferences[KEY_IS_LOGGED_IN] = true
            if (token != null) {
                preferences[KEY_AUTH_TOKEN] = token
            }
        }
    }

    suspend fun setDarkMode(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_DARK_MODE] = enabled
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { preferences ->
            preferences.remove(KEY_USER_ID)
            preferences.remove(KEY_PHONE_NUMBER)
            preferences.remove(KEY_AUTH_TOKEN)
            preferences[KEY_IS_LOGGED_IN] = false
            preferences[KEY_USER_ROLE] = UserRole.NONE.name
        }
    }
}

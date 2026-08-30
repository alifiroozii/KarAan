package com.karvin.app.core.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SecureTokenStore @Inject constructor(@ApplicationContext context: Context) {
    private val preferences = EncryptedSharedPreferences.create(
        context, "karvin_secure_session", MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )
    fun get(): String? = preferences.getString(KEY, null)
    fun save(token: String) { preferences.edit().putString(KEY, token).apply() }
    fun clear() { preferences.edit().remove(KEY).apply() }
    private companion object { const val KEY = "access_token" }
}

package com.karvin.app.core.network

import android.os.Build
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

object MobileDashboardSync {
    private val scope = CoroutineScope(Dispatchers.IO)
    private val BASE_URLS = listOf(
        "https://kar-aan.vercel.app",
        "http://10.0.2.2:3000",
        "http://127.0.0.1:3000"
    )

    fun syncUserSession(
        fullName: String,
        phone: String,
        email: String? = null,
        role: String = "WORKER",
        skills: List<String> = emptyList(),
        city: String = "تهران"
    ) {
        scope.launch {
            val json = JSONObject().apply {
                put("fullName", fullName)
                put("phone", phone)
                put("email", email ?: if (role == "EMPLOYER") "arash.employer@gmail.com" else "alifiroozi.dev@gmail.com")
                put("role", role)
                put("platform", "ANDROID")
                put("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL} (${Build.DEVICE})")
                put("appVersion", "KARJOOR v2.4.0 (Build 42)")
                put("city", city)
                val skillsArr = JSONArray()
                for (s in skills) skillsArr.put(s)
                put("skills", skillsArr)
            }
            postJson("/api/auth/gmail", json)
        }
    }

    fun syncJobCreated(
        title: String,
        category: String,
        budget: String,
        address: String? = null,
        details: String? = null,
        userEmail: String? = null,
        userPhone: String? = null,
        role: String = "EMPLOYER"
    ) {
        scope.launch {
            val json = JSONObject().apply {
                put("title", title)
                put("category", category)
                put("budget", budget)
                put("address", address ?: "تهران")
                put("city", "تهران")
                put("details", details ?: "")
                put("role", role)
                put("platform", "ANDROID")
                put("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL} (${Build.DEVICE})")
                if (!userEmail.isNullOrBlank()) put("userEmail", userEmail)
                if (!userPhone.isNullOrBlank()) put("userPhone", userPhone)
            }
            postJson("/api/requests", json)
        }
    }

    fun syncStatusUpdated(requestId: String, status: String, notes: String? = null) {
        scope.launch {
            val json = JSONObject().apply {
                put("status", status)
                put("notes", notes ?: "به‌روزرسانی و تأیید از طریق اپلیکیشن موبایل")
            }
            postJson("/api/requests/$requestId/status", json)
        }
    }

    private fun postJson(path: String, json: JSONObject) {
        for (baseUrl in BASE_URLS) {
            try {
                val url = URL("$baseUrl$path")
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json; charset=utf-8")
                    setRequestProperty("Accept", "application/json")
                    doOutput = true
                    connectTimeout = 4000
                    readTimeout = 4000
                }
                conn.outputStream.use { os ->
                    val bytes = json.toString().toByteArray(StandardCharsets.UTF_8)
                    os.write(bytes, 0, bytes.size)
                }
                // Read response code to complete request
                conn.responseCode
            } catch (_: Exception) {
                // Continue to next endpoint
            }
        }
    }
}


package com.karvin.app.core.network

import android.os.Build
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

object MobileDashboardSync {
    private const val TAG = "MobileDashboardSync"
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
            val cleanDigits = phone.filter { it.isDigit() }
            val determinedEmail = when {
                !email.isNullOrBlank() -> email.trim().lowercase()
                role == "EMPLOYER" -> if (cleanDigits.isNotEmpty() && cleanDigits != "09123456789") "employer_${cleanDigits}@karaan.app" else "employer_ali@karaan.app"
                else -> if (cleanDigits.isNotEmpty() && cleanDigits != "09123456789") "worker_${cleanDigits}@karaan.app" else "worker_ali@karaan.app"
            }
            val determinedPhone = when {
                phone.isNotBlank() && phone != "09123456789" -> phone
                role == "EMPLOYER" -> "09987654321"
                else -> "09123456789"
            }
            val determinedName = when {
                fullName.isNotBlank() && fullName != "علی فیروزی" -> fullName.trim()
                role == "EMPLOYER" -> "علی فیروزی (کارفرما)"
                else -> "علی فیروزی (کارجو)"
            }
            val json = JSONObject().apply {
                put("fullName", determinedName)
                put("phone", determinedPhone)
                put("email", determinedEmail)
                put("role", role)
                put("platform", "ANDROID")
                put("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL} (${Build.DEVICE})")
                put("appVersion", "KARJOOR v2.4.0 (Build 42)")
                put("city", city.ifBlank { "تهران" })
                val skillsArr = JSONArray()
                if (skills.isNotEmpty()) {
                    for (s in skills) skillsArr.put(s)
                } else if (role == "WORKER") {
                    skillsArr.put("برقکاری ساختمان")
                    skillsArr.put("تاسیسات و لوله‌کشی")
                }
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
                put("address", address ?: "تهران، میدان آزادی")
                put("city", "تهران")
                put("details", details ?: "درخواست ثبت‌شده از طریق اپلیکیشن موبایل")
                put("role", role)
                put("platform", "ANDROID")
                put("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL} (${Build.DEVICE})")
                put("userEmail", if (!userEmail.isNullOrBlank()) userEmail else if (role == "EMPLOYER") "employer_ali@karaan.app" else "worker_ali@karaan.app")
                put("userPhone", if (!userPhone.isNullOrBlank()) userPhone else if (role == "EMPLOYER") "09987654321" else "09123456789")
                put("fullName", if (role == "EMPLOYER") "علی فیروزی (کارفرما)" else "علی فیروزی (کارجو)")
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
                    setRequestProperty("User-Agent", "Karvin-Android-App/2.4.0")
                    doOutput = true
                    connectTimeout = 5000
                    readTimeout = 5000
                }
                conn.outputStream.use { os ->
                    val bytes = json.toString().toByteArray(StandardCharsets.UTF_8)
                    os.write(bytes, 0, bytes.size)
                }
                val code = conn.responseCode
                val resp = if (code in 200..299) {
                    conn.inputStream.bufferedReader().use { it.readText() }
                } else {
                    conn.errorStream?.bufferedReader()?.use { it.readText() } ?: "HTTP $code"
                }
                Log.i(TAG, "SUCCESS POST $url -> $code: $resp")
            } catch (e: Exception) {
                Log.w(TAG, "FAIL POST $baseUrl$path: ${e.message}")
            }
        }
    }
}



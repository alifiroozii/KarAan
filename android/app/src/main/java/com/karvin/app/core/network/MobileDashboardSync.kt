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

import java.time.LocalDate
import java.time.LocalTime
import com.karvin.app.domain.model.Job
import com.karvin.app.domain.model.JobStatus
import com.karvin.app.domain.model.PaymentType
import com.karvin.app.domain.model.GenderRequirement
import com.karvin.app.domain.model.User
import com.karvin.app.domain.model.UserRole
import com.karvin.app.data.FakeData

object MobileDashboardSync {
    private const val TAG = "MobileDashboardSync"
    private val scope = CoroutineScope(Dispatchers.IO)
    private val BASE_URLS = listOf(
        "https://kar-aan.vercel.app",
        "http://10.0.2.2:3000",
        "http://127.0.0.1:3000"
    )

    private var lastLocationSyncTime: Long = 0L
    @Volatile var activePhone: String = ""
    @Volatile var activeFullName: String = ""
    @Volatile var activeRole: String = "USER"
    @Volatile var activeToken: String = ""

    private val offlineQueue = java.util.concurrent.ConcurrentLinkedQueue<Pair<String, JSONObject>>()

    fun syncTelemetryEvent(
        action: String,
        phone: String = "",
        fullName: String = "",
        role: String = "USER",
        lat: Double? = null,
        lng: Double? = null,
        speed: Float? = null,
        details: Map<String, Any?> = emptyMap()
    ) {
        scope.launch {
            try {
                val effectivePhone = if (phone.isNotBlank()) phone else activePhone
                val effectiveName = if (fullName.isNotBlank()) fullName else {
                    if (activeFullName.isNotBlank()) activeFullName
                    else if (effectivePhone.isNotBlank()) "کاربر $effectivePhone"
                    else "کاربر اندروید"
                }
                val effectiveRole = if (role.isNotBlank() && role != "USER") role else activeRole

                val json = JSONObject().apply {
                    put("action", action)
                    put("entityName", "android_mobile")
                    put("entityId", effectivePhone.ifBlank { "device_${Build.MODEL}" })
                    put("phone", effectivePhone)
                    put("actorName", effectiveName)
                    put("role", effectiveRole)
                    put("platform", "ANDROID")
                    put("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL}")
                    put("appVersion", "KARJOOR v2.5")
                    if (lat != null) put("lat", lat)
                    if (lng != null) put("lng", lng)
                    if (speed != null) put("speed", speed)
                    val dObj = JSONObject()
                    for ((k, v) in details) {
                        dObj.put(k, v ?: JSONObject.NULL)
                    }
                    put("details", dObj)
                }
                postJson("/api/telemetry", json)
            } catch (e: Exception) {
                Log.w(TAG, "Error syncTelemetryEvent: ${e.message}")
            }
        }
    }

    fun syncAppLaunch(phone: String = "", role: String = "USER") {
        if (phone.isNotBlank()) activePhone = phone
        if (role.isNotBlank()) activeRole = role
        syncTelemetryEvent(
            action = "APP_LAUNCH",
            phone = phone,
            role = role,
            details = mapOf(
                "event" to "ورود و شروع به کار اپلیکیشن کارجور",
                "time" to System.currentTimeMillis()
            )
        )
    }

    fun syncLocationMovement(lat: Double, lng: Double, role: String = "USER", phone: String = "", speed: Float = 0f) {
        val now = System.currentTimeMillis()
        // Throttle location updates to every 4 seconds to conserve battery and server bandwidth
        if (now - lastLocationSyncTime < 4000L) return
        lastLocationSyncTime = now

        val effectivePhone = if (phone.isNotBlank()) phone else activePhone
        val effectiveRole = if (role.isNotBlank() && role != "USER") role else activeRole
        val effectiveName = if (activeFullName.isNotBlank()) activeFullName else if (effectivePhone.isNotBlank()) "کاربر $effectivePhone" else "کاربر اندروید"

        syncTelemetryEvent(
            action = "LOCATION_UPDATE",
            phone = effectivePhone,
            fullName = effectiveName,
            role = effectiveRole,
            lat = lat,
            lng = lng,
            speed = speed,
            details = mapOf(
                "coordinates" to "${String.format("%.4f", lat)}, ${String.format("%.4f", lng)}",
                "speedKmh" to (speed * 3.6f),
                "event" to "تغییر و پایش موقعیت مکانی کاربر روی نقشه اسنپی"
            )
        )
    }

    fun syncUserLogout(phone: String = "", role: String = "USER") {
        syncTelemetryEvent(
            action = "USER_LOGOUT",
            phone = phone.ifBlank { activePhone },
            role = role.ifBlank { activeRole },
            details = mapOf("event" to "خروج از حساب کاربری برای تغییر نقش یا جابجایی")
        )
        activePhone = ""
        activeFullName = ""
        activeRole = "USER"
    }

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
                cleanDigits.isNotEmpty() -> "user_${cleanDigits}@karaan.ir"
                else -> "user_${System.currentTimeMillis()}@karaan.ir"
            }
            val determinedPhone = phone.trim()
            val determinedName = fullName.trim().ifBlank {
                if (determinedPhone.isNotBlank()) "کاربر $determinedPhone" else "کاربر کارجور"
            }
            activePhone = determinedPhone
            activeFullName = determinedName
            activeRole = role
            val json = JSONObject().apply {
                put("fullName", determinedName)
                put("phone", determinedPhone)
                put("email", determinedEmail)
                put("role", role)
                put("platform", "ANDROID")
                put("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL} (${Build.DEVICE})")
                put("appVersion", "KARJOOR v2.5.0")
                put("city", city.ifBlank { "تهران" })
                val skillsArr = JSONArray()
                if (skills.isNotEmpty()) {
                    for (s in skills) skillsArr.put(s)
                }
                put("skills", skillsArr)
            }
            postJson("/api/auth/gmail", json)

            // Also record in central audit telemetry
            syncTelemetryEvent(
                action = "USER_LOGIN_PHONE",
                phone = determinedPhone,
                fullName = determinedName,
                role = role,
                details = mapOf(
                    "role" to role,
                    "city" to city,
                    "event" to "احراز هویت و لاگین مستقیم با شماره موبایل (بدون معطلی پیامک)"
                )
            )
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
        role: String = "EMPLOYER",
        fullName: String? = null,
    ) {
        scope.launch {
            val cleanDigits = (userPhone ?: "").filter { it.isDigit() }
            val determinedEmail = when {
                !userEmail.isNullOrBlank() -> userEmail.trim().lowercase()
                cleanDigits.isNotEmpty() -> "user_${cleanDigits}@karaan.ir"
                else -> "requester@karaan.ir"
            }
            val determinedPhone = userPhone?.trim().orEmpty()
            val determinedName = fullName?.trim()?.ifBlank { "کارفرمای کارجور" } ?: "کارفرمای کارجور"

            val json = JSONObject().apply {
                put("title", title)
                put("category", category)
                put("budget", budget)
                put("address", address ?: "تهران")
                put("city", "تهران")
                put("details", details ?: "درخواست ثبت‌شده از طریق اپلیکیشن موبایل")
                put("role", role)
                put("platform", "ANDROID")
                put("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL} (${Build.DEVICE})")
                put("userEmail", determinedEmail)
                put("userPhone", determinedPhone)
                put("fullName", determinedName)
            }
            postJson("/api/requests", json)

            // Also record in central telemetry
            syncTelemetryEvent(
                action = "ORDER_SUBMITTED",
                phone = determinedPhone,
                fullName = determinedName,
                role = role,
                details = mapOf(
                    "title" to title,
                    "category" to category,
                    "budget" to budget,
                    "address" to address,
                    "event" to "ثبت موفقیت‌آمیز سفارش کار در سرورهای ابری"
                )
            )
        }
    }

    fun syncProviderServiceCreated(
        title: String,
        category: String,
        rate: String,
        city: String = "تهران",
        address: String? = null,
        details: String? = null,
        userPhone: String? = null,
        fullName: String? = null,
        lat: Double? = null,
        lng: Double? = null,
        onSuccess: (() -> Unit)? = null
    ) {
        scope.launch {
            val determinedPhone = (userPhone ?: activePhone).trim()
            val determinedName = fullName?.trim()?.ifBlank { activeFullName } ?: activeFullName.ifBlank { "متخصص $determinedPhone" }

            val json = JSONObject().apply {
                put("title", title)
                put("category", category)
                put("rate", rate)
                put("city", city.ifBlank { "تهران" })
                put("address", address ?: "تهران، میدان انقلاب")
                put("details", details ?: "سرویس فعال ثبت‌شده توسط متخصص در اپلیکیشن اندروید")
                put("phone", determinedPhone)
                put("fullName", determinedName)
                if (lat != null) put("latitude", lat)
                if (lng != null) put("longitude", lng)
            }

            postJson("/api/providers/services", json)

            // Central telemetry audit log
            syncTelemetryEvent(
                action = "PROVIDER_SERVICE_OFFERED",
                phone = determinedPhone,
                fullName = determinedName,
                role = "WORKER",
                lat = lat,
                lng = lng,
                details = mapOf(
                    "title" to title,
                    "category" to category,
                    "rate" to rate,
                    "city" to city,
                    "event" to "ثبت رسمی سرویس و اعلام آمادگی به کارفرمایان"
                )
            )

            launch(Dispatchers.Main) {
                onSuccess?.invoke()
            }
        }
    }

    suspend fun fetchRemoteProviderServices(): List<com.karvin.app.domain.model.NearbyProvider> = kotlinx.coroutines.withContext(Dispatchers.IO) {
        for (baseUrl in BASE_URLS) {
            try {
                val url = URL("$baseUrl/api/providers/services")
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    setRequestProperty("Accept", "application/json")
                    setRequestProperty("User-Agent", "Karjoor-Android-App/2.5.0")
                    connectTimeout = 3000
                    readTimeout = 3000
                }
                if (conn.responseCode in 200..299) {
                    val body = conn.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(body)
                    if (json.optBoolean("success")) {
                        val dataObj = json.optJSONObject("data")
                        val items = dataObj?.optJSONArray("items") ?: JSONArray()
                        val list = mutableListOf<com.karvin.app.domain.model.NearbyProvider>()
                        for (i in 0 until items.length()) {
                            val itm = items.getJSONObject(i)
                            val lat = if (itm.has("latitude") && !itm.isNull("latitude")) itm.getDouble("latitude") else (35.7005 + (i * 0.002))
                            val lng = if (itm.has("longitude") && !itm.isNull("longitude")) itm.getDouble("longitude") else (51.3915 + (i * 0.002))
                            val serviceTitle = itm.optString("title", "خدمات فنی و ساختمانی")
                            val cat = itm.optString("category", "فنی")
                            val phoneNum = itm.optString("providerPhone", "")
                            val rateStr = itm.optString("rate", "توافقی")
                            val cleanRate = rateStr.filter { it.isDigit() }.toLongOrNull() ?: 150000L

                            list.add(
                                com.karvin.app.domain.model.NearbyProvider(
                                    id = itm.optString("id", "srv_$i"),
                                    name = itm.optString("providerName", "متخصص کارجور"),
                                    primarySkill = serviceTitle,
                                    skills = listOf(cat, serviceTitle),
                                    point = com.karvin.app.domain.model.GeoPoint(lat, lng),
                                    rating = itm.optDouble("rating", 5.0),
                                    reviewCount = itm.optInt("reviewCount", 1),
                                    completedJobs = 1,
                                    isAvailable = itm.optBoolean("isAvailable", true),
                                    isVerified = true,
                                    basePrice = cleanRate,
                                    shortBio = itm.optString("details", "متخصص آماده ارائه خدمات در محل"),
                                    responseTime = "کمتر از ۱۰ دقیقه",
                                    portfolioItems = emptyList(),
                                    services = listOf(serviceTitle),
                                    phone = phoneNum
                                )
                            )
                        }
                        if (list.isNotEmpty()) return@withContext list
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Error fetchRemoteProviderServices from $baseUrl: ${e.message}")
            }
        }
        emptyList()
    }

    fun syncStatusUpdated(requestId: String, status: String, notes: String? = null) {
        scope.launch {
            val json = JSONObject().apply {
                put("status", status)
                put("notes", notes ?: "به‌روزرسانی و تأیید از طریق اپلیکیشن موبایل")
            }
            postJson("/api/requests/$requestId/status", json)

            syncTelemetryEvent(
                action = "ORDER_STATUS_CHANGED",
                details = mapOf(
                    "requestId" to requestId,
                    "status" to status,
                    "notes" to notes,
                    "event" to "تغییر وضعیت مرحله کاری سفارش"
                )
            )
        }
    }

    private fun postJson(path: String, json: JSONObject) {
        var delivered = false
        for (baseUrl in BASE_URLS) {
            try {
                val url = URL("$baseUrl$path")
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json; charset=utf-8")
                    setRequestProperty("Accept", "application/json")
                    setRequestProperty("User-Agent", "Karjoor-Android-App/2.5.0")
                    setRequestProperty("X-Karjoor-Client", "android-secure-v2.5")
                    setRequestProperty("X-App-Platform", "ANDROID")
                    if (activeToken.isNotBlank()) {
                        setRequestProperty("Authorization", "Bearer $activeToken")
                    }
                    doOutput = true
                    connectTimeout = 3500
                    readTimeout = 3500
                }
                conn.outputStream.use { os ->
                    val bytes = json.toString().toByteArray(StandardCharsets.UTF_8)
                    os.write(bytes, 0, bytes.size)
                }
                val code = conn.responseCode
                if (code in 200..299) {
                    val resp = conn.inputStream.bufferedReader().use { it.readText() }
                    Log.i(TAG, "SUCCESS POST $url -> $code: $resp")
                    delivered = true
                    flushOfflineQueue()
                    break
                } else {
                    val err = conn.errorStream?.bufferedReader()?.use { it.readText() } ?: "HTTP $code"
                    Log.w(TAG, "POST $url non-200 ($code): $err")
                }
            } catch (e: Exception) {
                Log.w(TAG, "FAIL POST $baseUrl$path: ${e.message}")
            }
        }
        if (!delivered) {
            queueOfflineEvent(path, json)
        }
    }

    private fun queueOfflineEvent(path: String, json: JSONObject) {
        if (offlineQueue.size < 50) {
            offlineQueue.offer(path to json)
        }
    }

    private fun flushOfflineQueue() {
        if (offlineQueue.isEmpty()) return
        scope.launch {
            while (offlineQueue.isNotEmpty()) {
                val item = offlineQueue.poll() ?: break
                for (baseUrl in BASE_URLS) {
                    try {
                        val url = URL("$baseUrl${item.first}")
                        val conn = (url.openConnection() as HttpURLConnection).apply {
                            requestMethod = "POST"
                            setRequestProperty("Content-Type", "application/json; charset=utf-8")
                            setRequestProperty("Accept", "application/json")
                            setRequestProperty("User-Agent", "Karjoor-Android-App/2.5.0")
                            setRequestProperty("X-Karjoor-Client", "android-secure-v2.5")
                            setRequestProperty("X-App-Platform", "ANDROID")
                            if (activeToken.isNotBlank()) {
                                setRequestProperty("Authorization", "Bearer $activeToken")
                            }
                            doOutput = true
                            connectTimeout = 3000
                            readTimeout = 3000
                        }
                        conn.outputStream.use { os ->
                            val bytes = item.second.toString().toByteArray(StandardCharsets.UTF_8)
                            os.write(bytes, 0, bytes.size)
                        }
                        if (conn.responseCode in 200..299) {
                            break
                        }
                    } catch (_: Exception) {}
                }
            }
        }
    }

    suspend fun fetchRemoteJobs(): List<Job> {
        return kotlinx.coroutines.withContext(Dispatchers.IO) {
            for (baseUrl in BASE_URLS) {
                try {
                    val url = URL("$baseUrl/api/requests")
                    val conn = (url.openConnection() as HttpURLConnection).apply {
                        requestMethod = "GET"
                        setRequestProperty("Accept", "application/json")
                        setRequestProperty("User-Agent", "Karjoor-Android-App/2.5.0")
                        connectTimeout = 4000
                        readTimeout = 4000
                    }
                    if (conn.responseCode in 200..299) {
                        val body = conn.inputStream.bufferedReader().use { it.readText() }
                        val json = JSONObject(body)
                        val dataObj = json.optJSONObject("data") ?: continue
                        val itemsArr = dataObj.optJSONArray("items") ?: continue
                        val result = mutableListOf<Job>()
                        for (i in 0 until itemsArr.length()) {
                            val item = itemsArr.getJSONObject(i)
                            val id = item.optString("requestId", "job_$i")
                            val title = item.optString("title", "درخواست کار")
                            val catTitle = item.optString("category", "خدمات")
                            val category = FakeData.categories.firstOrNull { 
                                it.title.contains(catTitle) || catTitle.contains(it.title) 
                            } ?: FakeData.categories.first { it.id == "services" }
                            val budgetStr = item.optString("budget", "350000 تومان")
                            val cleanBudgetDigits = budgetStr.filter { it.isDigit() }
                            val amount = cleanBudgetDigits.toLongOrNull() ?: 350000L
                            val address = item.optString("address", "تهران")
                            val details = item.optString("details", "درخواست ثبت‌شده از سامانه")
                            val statusStr = item.optString("status", "ACTIVE")
                            val status = when (statusStr.uppercase()) {
                                "APPROVED", "ACCEPTED" -> JobStatus.ACCEPTED
                                "COMPLETED" -> JobStatus.COMPLETED
                                "CANCELLED" -> JobStatus.CANCELLED
                                else -> JobStatus.OPEN
                            }
                            val userObj = item.optJSONObject("user")
                            val userName = userObj?.optString("fullName")?.ifBlank { "کارفرمای کارجور" } ?: "کارفرمای کارجور"
                            val userPhone = userObj?.optString("phone")?.ifBlank { "09120000000" } ?: "09120000000"
                            val userEmail = userObj?.optString("email") ?: "requester@karaan.ir"
                            val employer = User(
                                id = userObj?.optString("id") ?: "employer_$i",
                                name = userName,
                                role = UserRole.REQUESTER,
                                city = "تهران",
                                phone = userPhone,
                                rating = 5.0,
                                completedJobs = 1,
                                point = FakeData.center,
                                bio = "کاربر ثبت شده در سامانه کارجور",
                                reviewCount = 0
                            )
                            result.add(
                                Job(
                                    id = id,
                                    title = title,
                                    category = category,
                                    description = details,
                                    employer = employer,
                                    requiredWorkers = 1,
                                    genderRequirement = GenderRequirement.ANY,
                                    date = LocalDate.now(),
                                    startTime = LocalTime.of(9, 0),
                                    durationHours = 4.0,
                                    amount = amount,
                                    paymentType = PaymentType.WALLET,
                                    address = address,
                                    point = FakeData.center,
                                    isUrgent = false,
                                    requiredSkills = listOf(category.title),
                                    status = status,
                                    applicantCount = 0
                                )
                            )
                        }
                        if (result.isNotEmpty()) {
                            Log.i(TAG, "SUCCESS fetched ${result.size} remote jobs from $baseUrl")
                            return@withContext result
                        }
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Fail fetchRemoteJobs from $baseUrl: ${e.message}")
                }
            }
            emptyList()
        }
    }

    fun refreshRemoteJobsAsync(onFetched: (List<Job>) -> Unit) {
        scope.launch {
            val jobs = fetchRemoteJobs()
            if (jobs.isNotEmpty()) {
                onFetched(jobs)
            }
        }
    }
}

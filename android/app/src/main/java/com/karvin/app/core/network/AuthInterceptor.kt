package com.karvin.app.core.network

import com.karvin.app.core.session.SessionManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val sessionManager: SessionManager,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        if (request.header("No-Auth") != null) {
            return chain.proceed(request.newBuilder().removeHeader("No-Auth").build())
        }
        val token = runBlocking { sessionManager.state.value.token }
        val authenticated = if (token.isNullOrBlank()) request else request.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()
        return chain.proceed(authenticated)
    }
}

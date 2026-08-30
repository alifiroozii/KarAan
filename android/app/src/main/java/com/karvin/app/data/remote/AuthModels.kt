package com.karvin.app.data.remote

import com.google.gson.annotations.SerializedName

 data class SendOtpRequest(
    @SerializedName("phone") val phone: String,
)

data class VerifyOtpRequest(
    @SerializedName("phone") val phone: String,
    @SerializedName("code") val code: String,
)

data class LoginRequest(
    @SerializedName("phone") val phone: String,
    @SerializedName("otp") val otp: String,
)

data class LoginResponse(
    @SerializedName("token") val token: String,
    @SerializedName("role") val role: String,
    @SerializedName("user") val user: UserDto? = null,
)

data class UserDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("phone") val phone: String,
)

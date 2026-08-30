package com.karvin.app.core.common

sealed interface ApiResult<out T> {
    data object Loading : ApiResult<Nothing>
    data class Success<T>(val data: T) : ApiResult<T>
    data class Error(val message: String, val cause: Throwable? = null) : ApiResult<Nothing>
}

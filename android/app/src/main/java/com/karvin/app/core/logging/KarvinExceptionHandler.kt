package com.karvin.app.core.logging

import android.content.Context
import com.google.firebase.crashlytics.FirebaseCrashlytics
import timber.log.Timber

class KarvinExceptionHandler(
    private val context: Context,
    private val delegate: Thread.UncaughtExceptionHandler? = Thread.getDefaultUncaughtExceptionHandler(),
) : Thread.UncaughtExceptionHandler {
    override fun uncaughtException(thread: Thread, throwable: Throwable) {
        Timber.e(throwable, "Unhandled exception caught in KarvinExceptionHandler")
        runCatching {
            FirebaseCrashlytics.getInstance().recordException(throwable)
        }
        delegate?.uncaughtException(thread, throwable)
    }
}

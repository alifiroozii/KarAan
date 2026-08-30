package com.karvin.app.core.logging

import android.content.Context
import android.content.Intent
import com.google.firebase.crashlytics.FirebaseCrashlytics
import timber.log.Timber

class KarvinExceptionHandler(
    private val context: Context,
    private val delegate: Thread.UncaughtExceptionHandler? = Thread.getDefaultUncaughtExceptionHandler(),
) : Thread.UncaughtExceptionHandler {
    override fun uncaughtException(thread: Thread, throwable: Throwable) {
        Timber.e(throwable, "Unhandled exception")
        FirebaseCrashlytics.getInstance().recordException(throwable)
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("uncaught_exception", true)
        }
        if (intent != null) context.startActivity(intent)
        delegate?.uncaughtException(thread, throwable)
    }
}

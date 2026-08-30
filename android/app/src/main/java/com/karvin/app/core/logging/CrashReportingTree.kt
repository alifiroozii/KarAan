package com.karvin.app.core.logging

import android.util.Log
import com.google.firebase.crashlytics.FirebaseCrashlytics
import timber.log.Timber

class CrashReportingTree(private val crashlytics: FirebaseCrashlytics = FirebaseCrashlytics.getInstance()) : Timber.Tree() {
    override fun log(priority: Int, tag: String?, message: String, t: Throwable?) {
        if (priority < Log.WARN) return
        crashlytics.log("${tag ?: "Karvin"}: $message")
        t?.let(crashlytics::recordException)
    }
}

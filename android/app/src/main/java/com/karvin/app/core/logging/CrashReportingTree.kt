package com.karvin.app.core.logging

import android.util.Log
import timber.log.Timber

class CrashReportingTree : Timber.Tree() {
    override fun log(priority: Int, tag: String?, message: String, t: Throwable?) {
        if (priority >= Log.WARN) {
            Log.println(priority, tag ?: "Karvin", message)
            t?.let { Log.println(priority, tag ?: "Karvin", Log.getStackTraceString(it)) }
        }
    }
}

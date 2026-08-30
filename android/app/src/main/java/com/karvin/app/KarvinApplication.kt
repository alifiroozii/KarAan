package com.karvin.app

import android.app.Application
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.karvin.app.core.sync.KarvinSyncWorker
import com.karvin.app.core.logging.CrashReportingTree
import com.karvin.app.core.logging.KarvinExceptionHandler
import timber.log.Timber
import dagger.hilt.android.HiltAndroidApp
import java.util.concurrent.TimeUnit

@HiltAndroidApp
class KarvinApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) Timber.plant(Timber.DebugTree()) else Timber.plant(CrashReportingTree())
        Thread.setDefaultUncaughtExceptionHandler(KarvinExceptionHandler(this))
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "karvin-cache-sync",
            ExistingPeriodicWorkPolicy.KEEP,
            PeriodicWorkRequestBuilder<KarvinSyncWorker>(6, TimeUnit.HOURS).build(),
        )
    }
}

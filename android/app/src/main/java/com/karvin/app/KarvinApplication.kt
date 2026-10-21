package com.karvin.app

import android.app.Application
import androidx.work.Configuration
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.karvin.app.core.sync.KarvinSyncWorker
import com.karvin.app.core.logging.KarvinExceptionHandler
import timber.log.Timber
import dagger.hilt.android.HiltAndroidApp
import java.util.concurrent.TimeUnit

@HiltAndroidApp
class KarvinApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Timber.plant(Timber.DebugTree())
        Thread.setDefaultUncaughtExceptionHandler(KarvinExceptionHandler(this))
        try {
            if (!WorkManager.isInitialized()) {
                WorkManager.initialize(this, Configuration.Builder().build())
            }
        } catch (e: Exception) {
            Timber.w(e, "WorkManager initialization handled safely")
        }
        try {
            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "karvin-cache-sync",
                ExistingPeriodicWorkPolicy.KEEP,
                PeriodicWorkRequestBuilder<KarvinSyncWorker>(6, TimeUnit.HOURS).build(),
            )
        } catch (e: Exception) {
            Timber.w(e, "WorkManager periodic work enqueue handled safely")
        }
    }
}

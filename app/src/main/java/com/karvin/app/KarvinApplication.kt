package com.karvin.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class KarvinApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}

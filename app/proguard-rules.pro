# KARVIN Android Proguard Rules

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.** { *; }

# Google Play Services & Maps
-keep class com.google.android.gms.maps.** { *; }
-keep interface com.google.android.gms.maps.** { *; }
-keep class com.google.android.gms.location.** { *; }
-keep interface com.google.android.gms.location.** { *; }

# Gson & Retrofit
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class com.karvin.app.data.remote.dto.** { *; }
-keep class com.karvin.app.domain.model.** { *; }

# Room Database
-keep class androidx.room.** { *; }
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Hilt & Dagger
-keep class dagger.hilt.** { *; }
-keep class * extends dagger.hilt.internal.GeneratedComponent

# DataStore
-keep class androidx.datastore.** { *; }

# AndroidX Core
-dontwarn android.hardware.camera2.**
-dontwarn javax.annotation.**

package com.karvin.app.di

import android.content.Context
import androidx.room.Room
import com.karvin.app.data.local.KarvinDatabase
import com.karvin.app.data.local.dao.JobApplicationDao
import com.karvin.app.data.local.dao.JobDao
import com.karvin.app.data.local.dao.NotificationDao
import com.karvin.app.data.local.dao.RatingDao
import com.karvin.app.data.local.dao.ShiftDao
import com.karvin.app.data.local.dao.UserDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideKarvinDatabase(@ApplicationContext context: Context): KarvinDatabase {
        return Room.databaseBuilder(
            context,
            KarvinDatabase::class.java,
            KarvinDatabase.DATABASE_NAME
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideUserDao(database: KarvinDatabase): UserDao = database.userDao()

    @Provides
    fun provideJobDao(database: KarvinDatabase): JobDao = database.jobDao()

    @Provides
    fun provideJobApplicationDao(database: KarvinDatabase): JobApplicationDao = database.applicationDao()

    @Provides
    fun provideShiftDao(database: KarvinDatabase): ShiftDao = database.shiftDao()

    @Provides
    fun provideNotificationDao(database: KarvinDatabase): NotificationDao = database.notificationDao()

    @Provides
    fun provideRatingDao(database: KarvinDatabase): RatingDao = database.ratingDao()
}

package com.karvin.app.di

import android.content.Context
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.karvin.app.data.local.KarvinDatabase
import com.karvin.app.data.local.dao.JobApplicationDao
import com.karvin.app.data.local.dao.JobDao
import com.karvin.app.data.local.dao.NotificationDao
import com.karvin.app.data.local.dao.RatingDao
import com.karvin.app.data.local.dao.ShiftDao
import com.karvin.app.data.local.dao.UserDao
import com.karvin.app.data.mapper.toEntity
import com.karvin.app.data.repository.FakeDataGenerator
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Provider
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideKarvinDatabase(
        @ApplicationContext context: Context,
        databaseProvider: Provider<KarvinDatabase>
    ): KarvinDatabase {
        return Room.databaseBuilder(
            context,
            KarvinDatabase::class.java,
            KarvinDatabase.DATABASE_NAME
        )
            .fallbackToDestructiveMigration()
            .addCallback(object : RoomDatabase.Callback() {
                override fun onCreate(db: SupportSQLiteDatabase) {
                    super.onCreate(db)
                    CoroutineScope(Dispatchers.IO).launch {
                        try {
                            val database = databaseProvider.get()
                            // Seed 100 jobs
                            val jobs = FakeDataGenerator.generate100Jobs()
                            database.jobDao().insertJobs(jobs.map { it.toEntity() })

                            // Seed default worker profile
                            val worker = FakeDataGenerator.generate100Workers().first()
                            database.userDao().insertWorkerProfile(worker.toEntity())
                        } catch (t: Throwable) {
                            // Non-blocking catch
                        }
                    }
                }
            })
            .build()
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

package com.karvin.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.karvin.app.data.local.dao.JobApplicationDao
import com.karvin.app.data.local.dao.JobDao
import com.karvin.app.data.local.dao.NotificationDao
import com.karvin.app.data.local.dao.RatingDao
import com.karvin.app.data.local.dao.ShiftDao
import com.karvin.app.data.local.dao.UserDao
import com.karvin.app.data.local.entity.Converters
import com.karvin.app.data.local.entity.EmployerProfileEntity
import com.karvin.app.data.local.entity.JobApplicationEntity
import com.karvin.app.data.local.entity.JobEntity
import com.karvin.app.data.local.entity.NotificationEntity
import com.karvin.app.data.local.entity.RatingEntity
import com.karvin.app.data.local.entity.ShiftEntity
import com.karvin.app.data.local.entity.UserEntity
import com.karvin.app.data.local.entity.WorkerProfileEntity

@Database(
    entities = [
        UserEntity::class,
        WorkerProfileEntity::class,
        EmployerProfileEntity::class,
        JobEntity::class,
        JobApplicationEntity::class,
        ShiftEntity::class,
        NotificationEntity::class,
        RatingEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class KarvinDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun jobDao(): JobDao
    abstract fun applicationDao(): JobApplicationDao
    abstract fun shiftDao(): ShiftDao
    abstract fun notificationDao(): NotificationDao
    abstract fun ratingDao(): RatingDao

    companion object {
        const val DATABASE_NAME = "karvin_database.db"
    }
}

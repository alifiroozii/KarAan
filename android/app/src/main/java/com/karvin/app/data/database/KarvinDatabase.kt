package com.karvin.app.data.database

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [
        CachedJobEntity::class,
        CachedWorkerEntity::class,
        CachedMessageEntity::class,
        FavoriteEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class KarvinDatabase : RoomDatabase() {
    abstract fun karvinDao(): KarvinDao
}

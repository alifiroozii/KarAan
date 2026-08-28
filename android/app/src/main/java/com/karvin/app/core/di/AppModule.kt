package com.karvin.app.core.di

import android.content.Context
import androidx.room.Room
import com.karvin.app.data.PreferencesStore
import com.karvin.app.data.database.KarvinDao
import com.karvin.app.data.database.KarvinDatabase
import com.karvin.app.data.repository.FakeAuthRepository
import com.karvin.app.data.repository.FakeChatRepository
import com.karvin.app.data.repository.FakeJobRepository
import com.karvin.app.data.repository.FakeNotificationRepository
import com.karvin.app.data.repository.FakeRepositoryStore
import com.karvin.app.data.repository.FakeWorkerRepository
import com.karvin.app.domain.repository.AuthRepository
import com.karvin.app.domain.repository.ChatRepository
import com.karvin.app.domain.repository.JobRepository
import com.karvin.app.domain.repository.NotificationRepository
import com.karvin.app.domain.repository.WorkerRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): KarvinDatabase =
        Room.databaseBuilder(context, KarvinDatabase::class.java, "karvin-cache.db")
            .fallbackToDestructiveMigration(dropAllTables = true)
            .build()

    @Provides
    fun provideDao(database: KarvinDatabase): KarvinDao = database.karvinDao()

    @Provides
    @Singleton
    fun providePreferences(@ApplicationContext context: Context): PreferencesStore = PreferencesStore(context)

    @Provides
    @Singleton
    fun provideRepositoryStore(dao: KarvinDao): FakeRepositoryStore = FakeRepositoryStore(dao)

    @Provides
    @Singleton
    fun provideAuthRepository(preferences: PreferencesStore): AuthRepository = FakeAuthRepository(preferences)

    @Provides
    @Singleton
    fun provideJobRepository(store: FakeRepositoryStore): JobRepository = FakeJobRepository(store)

    @Provides
    @Singleton
    fun provideWorkerRepository(store: FakeRepositoryStore): WorkerRepository = FakeWorkerRepository(store)

    @Provides
    @Singleton
    fun provideChatRepository(store: FakeRepositoryStore): ChatRepository = FakeChatRepository(store)

    @Provides
    @Singleton
    fun provideNotificationRepository(store: FakeRepositoryStore): NotificationRepository = FakeNotificationRepository(store)

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder().build()

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit = Retrofit.Builder()
        .baseUrl("https://api.karvin.app/")
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
}

package com.karvin.app.core.network

import com.karvin.app.feature.media.MediaApi
import com.karvin.app.feature.media.MediaRepository
import com.karvin.app.feature.media.MediaRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class MediaBindingsModule {
    @Binds @Singleton abstract fun bindMediaRepository(implementation: MediaRepositoryImpl): MediaRepository

}

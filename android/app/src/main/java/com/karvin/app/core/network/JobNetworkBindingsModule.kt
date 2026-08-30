package com.karvin.app.core.network

import com.karvin.app.data.remote.JobApi
import com.karvin.app.data.repository.JobRepositoryImpl
import com.karvin.app.domain.repository.RemoteJobRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class JobNetworkBindingsModule {
    @Binds
    @Singleton
    abstract fun bindRemoteJobRepository(implementation: JobRepositoryImpl): RemoteJobRepository

    companion object {
        @Provides
        @Singleton
        fun provideJobApi(retrofit: Retrofit): JobApi = retrofit.create(JobApi::class.java)
    }
}

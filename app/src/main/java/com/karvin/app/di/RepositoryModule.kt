package com.karvin.app.di

import com.karvin.app.data.repository.AuthRepositoryImpl
import com.karvin.app.data.repository.EmployerRepositoryImpl
import com.karvin.app.data.repository.JobRepositoryImpl
import com.karvin.app.data.repository.NotificationRepositoryImpl
import com.karvin.app.data.repository.WorkerRepositoryImpl
import com.karvin.app.domain.repository.AuthRepository
import com.karvin.app.domain.repository.EmployerRepository
import com.karvin.app.domain.repository.JobRepository
import com.karvin.app.domain.repository.NotificationRepository
import com.karvin.app.domain.repository.WorkerRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindWorkerRepository(impl: WorkerRepositoryImpl): WorkerRepository

    @Binds
    @Singleton
    abstract fun bindEmployerRepository(impl: EmployerRepositoryImpl): EmployerRepository

    @Binds
    @Singleton
    abstract fun bindJobRepository(impl: JobRepositoryImpl): JobRepository

    @Binds
    @Singleton
    abstract fun bindNotificationRepository(impl: NotificationRepositoryImpl): NotificationRepository
}

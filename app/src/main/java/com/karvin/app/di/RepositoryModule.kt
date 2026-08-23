package com.karvin.app.di

import com.karvin.app.data.repository.AuthRepositoryImpl
import com.karvin.app.data.repository.ChatRepositoryImpl
import com.karvin.app.data.repository.EmployerRepositoryImpl
import com.karvin.app.data.repository.JobRepositoryImpl
import com.karvin.app.data.repository.LocationRepositoryImpl
import com.karvin.app.data.repository.MatchingRepositoryImpl
import com.karvin.app.data.repository.NotificationRepositoryImpl
import com.karvin.app.data.repository.PaymentRepositoryImpl
import com.karvin.app.data.repository.WalletRepositoryImpl
import com.karvin.app.data.repository.WorkerRepositoryImpl
import com.karvin.app.domain.repository.AuthRepository
import com.karvin.app.domain.repository.ChatRepository
import com.karvin.app.domain.repository.EmployerRepository
import com.karvin.app.domain.repository.JobRepository
import com.karvin.app.domain.repository.LocationRepository
import com.karvin.app.domain.repository.MatchingRepository
import com.karvin.app.domain.repository.NotificationRepository
import com.karvin.app.domain.repository.PaymentRepository
import com.karvin.app.domain.repository.WalletRepository
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

    @Binds
    @Singleton
    abstract fun bindLocationRepository(impl: LocationRepositoryImpl): LocationRepository

    @Binds
    @Singleton
    abstract fun bindMatchingRepository(impl: MatchingRepositoryImpl): MatchingRepository

    @Binds
    @Singleton
    abstract fun bindChatRepository(impl: ChatRepositoryImpl): ChatRepository

    @Binds
    @Singleton
    abstract fun bindWalletRepository(impl: WalletRepositoryImpl): WalletRepository

    @Binds
    @Singleton
    abstract fun bindPaymentRepository(impl: PaymentRepositoryImpl): PaymentRepository
}

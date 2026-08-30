package com.karvin.app.core.network

import com.karvin.app.data.remote.PaymentApi
import com.karvin.app.data.repository.PaymentRepositoryImpl
import com.karvin.app.domain.repository.PaymentRepository
import com.karvin.app.domain.repository.JobRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class PaymentBindingsModule {
    @Binds @Singleton abstract fun bindPaymentRepository(implementation: PaymentRepositoryImpl): PaymentRepository
}

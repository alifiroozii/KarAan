package com.karvin.app.core.di

import com.karvin.app.data.repository.MockAuthRepositoryImpl
import com.karvin.app.domain.repository.PhoneAuthRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class PhoneAuthModule {
    @Binds
    @Singleton
    abstract fun bindPhoneAuthRepository(implementation: MockAuthRepositoryImpl): PhoneAuthRepository
}

package com.karvin.app.core.network

import com.karvin.app.data.repository.AuthRepositoryImpl
import com.karvin.app.domain.repository.NetworkAuthRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class NetworkBindingsModule {
    @Binds
    @Singleton
    abstract fun bindNetworkAuthRepository(
        implementation: AuthRepositoryImpl,
    ): NetworkAuthRepository
}

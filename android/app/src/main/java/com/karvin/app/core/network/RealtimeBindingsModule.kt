package com.karvin.app.core.network

import com.karvin.app.data.repository.RealtimeChatRepository
import com.karvin.app.data.database.ChatMessageDao
import com.karvin.app.data.database.KarvinDatabase
import com.karvin.app.domain.repository.ChatRepository
import com.karvin.app.data.remote.ChatWebSocketClient
import com.karvin.app.data.remote.OkHttpChatWebSocketClient
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import dagger.Provides

@Module
@InstallIn(SingletonComponent::class)
abstract class RealtimeBindingsModule {
    @Binds
    @Singleton
    abstract fun bindRealtimeChatRepository(implementation: RealtimeChatRepository): ChatRepository

    @Binds
    @Singleton
    abstract fun bindChatWebSocketClient(implementation: OkHttpChatWebSocketClient): ChatWebSocketClient

    companion object {
        @Provides
        @Singleton
        fun provideChatMessageDao(database: KarvinDatabase): ChatMessageDao = database.chatMessageDao()
    }
}

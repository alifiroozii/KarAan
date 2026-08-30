package com.karvin.app.data.remote

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import javax.inject.Inject

interface ChatWebSocketClient {
    fun messages(conversationId: String): Flow<SocketMessage>
    fun send(conversationId: String, text: String): Boolean
    fun close()
}

data class SocketMessage(
    val id: String,
    val conversationId: String,
    val senderId: String,
    val text: String,
    val sentAtEpochSeconds: Long,
    val status: String = "DELIVERED",
)

class OkHttpChatWebSocketClient @Inject constructor(
    private val client: OkHttpClient,
) : ChatWebSocketClient {
    private var socket: WebSocket? = null
    private var activeConversation: String? = null

    override fun messages(conversationId: String): Flow<SocketMessage> = callbackFlow {
        activeConversation = conversationId
        socket = client.newWebSocket(
            Request.Builder().url("wss://api.karvin.app/ws/chat/$conversationId").build(),
            object : WebSocketListener() {
                override fun onMessage(webSocket: WebSocket, text: String) {
                    runCatching {
                        val json = JSONObject(text)
                        trySend(SocketMessage(
                            id = json.getString("id"),
                            conversationId = json.optString("conversationId", conversationId),
                            senderId = json.getString("senderId"),
                            text = json.getString("text"),
                            sentAtEpochSeconds = json.optLong("sentAt", System.currentTimeMillis() / 1000),
                            status = json.optString("status", "DELIVERED"),
                        ))
                    }
                }
            },
        )
        awaitClose { close() }
    }

    override fun send(conversationId: String, text: String): Boolean =
        socket?.send(JSONObject().apply {
            put("conversationId", conversationId)
            put("text", text)
        }.toString()) == true

    override fun close() {
        socket?.close(1000, "closed")
        socket = null
        activeConversation = null
    }
}

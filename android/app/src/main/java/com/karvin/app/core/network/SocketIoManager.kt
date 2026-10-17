package com.karvin.app.core.network

import com.karvin.app.BuildConfig
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

data class RealtimeLocationUpdate(
    val workerId: String,
    val latitude: Double,
    val longitude: Double,
    val timestamp: Long,
)

data class RealtimeOfferEvent(
    val offerId: String,
    val shiftId: String,
    val role: String,
    val hourlyRate: Long,
    val expiresAt: String,
)

data class RealtimeShiftStatusEvent(
    val shiftId: String,
    val status: String,
    val workerId: String?,
)

@Singleton
class SocketIoManager @Inject constructor() {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var socket: Socket? = null

    private val _locationFlow = MutableSharedFlow<RealtimeLocationUpdate>(extraBufferCapacity = 64)
    val locationFlow: SharedFlow<RealtimeLocationUpdate> = _locationFlow.asSharedFlow()

    private val _offerFlow = MutableSharedFlow<RealtimeOfferEvent>(extraBufferCapacity = 16)
    val offerFlow: SharedFlow<RealtimeOfferEvent> = _offerFlow.asSharedFlow()

    private val _shiftStatusFlow = MutableSharedFlow<RealtimeShiftStatusEvent>(extraBufferCapacity = 32)
    val shiftStatusFlow: SharedFlow<RealtimeShiftStatusEvent> = _shiftStatusFlow.asSharedFlow()

    fun connect(jwtToken: String? = null) {
        if (socket?.connected() == true) return

        try {
            val options = IO.Options().apply {
                reconnection = true
                reconnectionDelay = 1500
                reconnectionAttempts = 10
                timeout = 10000
                if (!jwtToken.isNullOrBlank()) {
                    auth = mapOf("token" to jwtToken)
                }
            }

            val serverUrl = BuildConfig.API_BASE_URL.trimEnd('/')
            socket = IO.socket(serverUrl, options).apply {
                on(Socket.EVENT_CONNECT) {
                    Timber.d("Socket.IO connected to $serverUrl")
                }
                on(Socket.EVENT_DISCONNECT) {
                    Timber.d("Socket.IO disconnected")
                }
                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Timber.w("Socket.IO connection error: ${args.firstOrNull()}")
                }

                // ─── Realtime Events from Next.js backend ───
                on("worker.location.updated") { args ->
                    val data = args.firstOrNull() as? JSONObject ?: return@on
                    val update = RealtimeLocationUpdate(
                        workerId = data.optString("workerId"),
                        latitude = data.optDouble("latitude"),
                        longitude = data.optDouble("longitude"),
                        timestamp = data.optLong("timestamp", System.currentTimeMillis()),
                    )
                    scope.launch { _locationFlow.emit(update) }
                }

                on("offer.created") { args ->
                    val data = args.firstOrNull() as? JSONObject ?: return@on
                    val offer = RealtimeOfferEvent(
                        offerId = data.optString("offerId", data.optString("id")),
                        shiftId = data.optString("shiftId"),
                        role = data.optString("role"),
                        hourlyRate = data.optLong("hourlyRate", 0L),
                        expiresAt = data.optString("expiresAt"),
                    )
                    scope.launch { _offerFlow.emit(offer) }
                }

                on("shift.updated") { args ->
                    val data = args.firstOrNull() as? JSONObject ?: return@on
                    val statusEvent = RealtimeShiftStatusEvent(
                        shiftId = data.optString("shiftId", data.optString("id")),
                        status = data.optString("status"),
                        workerId = data.optString("workerId").takeIf { it.isNotEmpty() },
                    )
                    scope.launch { _shiftStatusFlow.emit(statusEvent) }
                }

                connect()
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to initialize Socket.IO")
        }
    }

    fun joinRoom(roomName: String) {
        socket?.emit("join", JSONObject().put("room", roomName))
        Timber.d("Joined room: $roomName")
    }

    fun leaveRoom(roomName: String) {
        socket?.emit("leave", JSONObject().put("room", roomName))
        Timber.d("Left room: $roomName")
    }

    fun broadcastLocation(latitude: Double, longitude: Double) {
        socket?.emit(
            "worker.location.updated",
            JSONObject().apply {
                put("latitude", latitude)
                put("longitude", longitude)
                put("timestamp", System.currentTimeMillis())
            },
        )
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        Timber.d("Socket.IO client disconnected and cleaned up")
    }
}

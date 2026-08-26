package com.karvin.app.core.notification

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class KarvinMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // Forward the token to the notification repository when the real API is connected.
    }

    override fun onMessageReceived(message: RemoteMessage) {
        // The demo repository exposes notifications in-app; a production implementation posts a system notification here.
    }
}

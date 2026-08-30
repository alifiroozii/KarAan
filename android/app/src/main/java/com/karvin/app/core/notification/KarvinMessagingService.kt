package com.karvin.app.core.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.karvin.app.MainActivity
import com.karvin.app.R

class KarvinMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // ارسال token به NotificationRepository/API در لایه data انجام می‌شود.
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val type = message.data["type"].orEmpty()
        val route = message.data["route"] ?: when (type) {
            "message" -> "chat"
            "job_accepted" -> "provider_jobs"
            else -> "notifications"
        }
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("deep_link_route", route)
            message.data["conversationId"]?.let { putExtra("conversationId", it) }
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(this, route.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val channelId = "karvin_updates"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel(channelId, "به‌روزرسانی‌ها", NotificationManager.IMPORTANCE_DEFAULT))
        NotificationManagerCompat.from(this).notify(System.currentTimeMillis().toInt(), NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(message.notification?.title ?: message.data["title"] ?: "کاروین")
            .setContentText(message.notification?.body ?: message.data["body"] ?: "اعلان جدید دارید")
            .setAutoCancel(true).setContentIntent(pendingIntent).build())
    }
}

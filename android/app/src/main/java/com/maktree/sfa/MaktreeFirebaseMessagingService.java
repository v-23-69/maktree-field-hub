package com.maktree.sfa;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Build;
import android.text.TextUtils;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

public class MaktreeFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MaktreeFCM";
    private static final AtomicInteger NOTIFICATION_ID = new AtomicInteger(4000);

    static final String EXTRA_URL = "notification_url";
    static final String EXTRA_ACTION = "notification_action";
    static final String EXTRA_TOKEN = "notification_token";
    static final String EXTRA_KIND = "notification_kind";
    static final String EXTRA_NOTIFICATION_ID = "notification_id";

    static final String ACTION_QUICK = "com.maktree.sfa.NOTIFICATION_QUICK_ACTION";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (data == null || data.isEmpty()) {
            return;
        }

        String displayMode = firstNonEmpty(data.get("display_mode"), "");
        if (remoteMessage.getNotification() != null && !"rich_actions".equals(displayMode)) {
            return;
        }

        showRichNotification(data);
    }

    private void showRichNotification(Map<String, String> data) {
        String title = firstNonEmpty(data.get("title"), "Maktree SFA");
        String body = firstNonEmpty(data.get("body"), "");
        String subtitle = firstNonEmpty(data.get("subtitle"), "");
        String bigText = firstNonEmpty(data.get("big_text"), body);
        String url = firstNonEmpty(data.get("url"), "/");
        String kind = firstNonEmpty(data.get("kind"), "");
        String notificationId = firstNonEmpty(data.get("notification_id"), "");
        String channelId = firstNonEmpty(data.get("channel_id"), "maktree_alerts");
        String actionsJson = firstNonEmpty(data.get("actions"), "[]");

        ensureChannel(channelId);

        int id = NOTIFICATION_ID.incrementAndGet();
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_stat_maktree)
            .setLargeIcon(loadLargeIcon())
            .setContentTitle(title)
            .setContentText(body)
            .setSubText(TextUtils.isEmpty(subtitle) ? null : subtitle)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(bigText).setSummaryText(subtitle))
            .setColor(Color.parseColor("#2563EB"))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setContentIntent(buildOpenIntent(id, url, kind, notificationId, null, null));

        appendStandardActions(builder, id, url, kind, notificationId, actionsJson);

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(id, builder.build());
        }
    }

    private void appendStandardActions(
        NotificationCompat.Builder builder,
        int notificationId,
        String url,
        String kind,
        String rowId,
        String actionsJson
    ) {
        try {
            JSONArray actions = new JSONArray(actionsJson);
            for (int i = 0; i < actions.length() && i < 2; i++) {
                JSONObject action = actions.getJSONObject(i);
                String actionId = action.optString("id", "");
                String token = action.optString("token", "");
                if (TextUtils.isEmpty(actionId) || TextUtils.isEmpty(token)) {
                    continue;
                }

                boolean isApprove = "approve".equalsIgnoreCase(actionId);
                int icon = isApprove ? android.R.drawable.ic_menu_save : android.R.drawable.ic_menu_close_clear_cancel;
                String label = isApprove ? "Approve" : "Decline";

                PendingIntent pending = PendingIntent.getBroadcast(
                    this,
                    (notificationId * 10) + i,
                    new Intent(this, NotificationActionReceiver.class)
                        .setAction(ACTION_QUICK)
                        .putExtra(EXTRA_URL, url)
                        .putExtra(EXTRA_KIND, kind)
                        .putExtra(EXTRA_NOTIFICATION_ID, rowId)
                        .putExtra(EXTRA_ACTION, actionId)
                        .putExtra(EXTRA_TOKEN, token)
                        .putExtra("android_notification_id", notificationId),
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                builder.addAction(new NotificationCompat.Action.Builder(icon, label, pending).build());
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to parse notification actions", e);
        }
    }

    private PendingIntent buildOpenIntent(
        int requestCode,
        String url,
        String kind,
        String rowId,
        String action,
        String token
    ) {
        Intent intent = new Intent(this, MainActivity.class)
            .putExtra(EXTRA_URL, url)
            .putExtra(EXTRA_KIND, kind)
            .putExtra(EXTRA_NOTIFICATION_ID, rowId)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        if (action != null) {
            intent.putExtra(EXTRA_ACTION, action);
        }
        if (token != null) {
            intent.putExtra(EXTRA_TOKEN, token);
        }

        return PendingIntent.getActivity(
            this,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private Bitmap loadLargeIcon() {
        try {
            return BitmapFactory.decodeResource(getResources(), R.drawable.maktree_notification_large);
        } catch (Exception e) {
            return null;
        }
    }

    private void ensureChannel(String channelId) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) {
            return;
        }
        if (manager.getNotificationChannel(channelId) != null) {
            return;
        }

        String name;
        int importance;
        if ("maktree_reminders".equals(channelId)) {
            name = "Maktree Reminders";
            importance = NotificationManager.IMPORTANCE_DEFAULT;
        } else if ("maktree_activity".equals(channelId)) {
            name = "Maktree Activity";
            importance = NotificationManager.IMPORTANCE_DEFAULT;
        } else {
            name = "Maktree Alerts";
            importance = NotificationManager.IMPORTANCE_HIGH;
        }

        NotificationChannel channel = new NotificationChannel(channelId, name, importance);
        channel.setDescription("Maktree SFA notifications");
        channel.enableLights(true);
        channel.setLightColor(Color.parseColor("#2563EB"));
        channel.enableVibration(true);
        manager.createNotificationChannel(channel);
    }

    private static String firstNonEmpty(String value, String fallback) {
        if (value == null || value.trim().isEmpty()) {
            return fallback;
        }
        return value.trim();
    }
}

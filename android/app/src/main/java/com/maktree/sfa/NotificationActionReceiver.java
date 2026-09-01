package com.maktree.sfa;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NotificationActionReceiver extends BroadcastReceiver {
    private static final String TAG = "MaktreePushAction";
    private static final ExecutorService EXECUTOR = Executors.newFixedThreadPool(3);

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !MaktreeFirebaseMessagingService.ACTION_QUICK.equals(intent.getAction())) {
            return;
        }

        final PendingResult pendingResult = goAsync();
        final String action = intent.getStringExtra(MaktreeFirebaseMessagingService.EXTRA_ACTION);
        final String token = intent.getStringExtra(MaktreeFirebaseMessagingService.EXTRA_TOKEN);
        final int androidNotificationId = intent.getIntExtra("android_notification_id", -1);

        if (action == null || token == null || token.isEmpty()) {
            openApp(context, intent);
            pendingResult.finish();
            return;
        }

        if (androidNotificationId >= 0) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(androidNotificationId);
            }
        }

        final String rpcAction = normalizeAction(action);
        final boolean isApprove = "approve".equals(rpcAction);
        showToast(context, isApprove ? "Approving…" : "Declining…");

        EXECUTOR.execute(() -> {
            boolean ok = false;
            boolean requiresApp = false;
            String errorMessage = null;

            try {
                JSONObject result = callQuickAction(context, token, rpcAction);
                ok = result != null && result.optBoolean("ok", false);
            } catch (Exception e) {
                String msg = e.getMessage() == null ? "" : e.getMessage();
                requiresApp = msg.contains("quick_action_requires_app");
                errorMessage = msg;
                Log.w(TAG, "Quick action failed: " + msg);
            }

            boolean finalOk = ok;
            boolean finalRequiresApp = requiresApp;
            new Handler(Looper.getMainLooper()).post(() -> {
                if (finalOk) {
                    showToast(context, isApprove ? "Approved ✓" : "Declined ✓");
                } else if (finalRequiresApp) {
                    showToast(context, "Opening app to confirm…");
                    openApp(context, intent);
                } else {
                    showToast(context, "Action failed — open app to retry");
                    openApp(context, intent);
                }
                pendingResult.finish();
            });
        });
    }

    private static String normalizeAction(String action) {
        if ("decline".equalsIgnoreCase(action)) {
            return "reject";
        }
        return action.toLowerCase();
    }

    private static void showToast(Context context, String message) {
        new Handler(Looper.getMainLooper()).post(() ->
            Toast.makeText(context.getApplicationContext(), message, Toast.LENGTH_SHORT).show()
        );
    }

    private JSONObject callQuickAction(Context context, String token, String action) throws Exception {
        String baseUrl = context.getString(R.string.supabase_url);
        String anonKey = context.getString(R.string.supabase_anon_key);
        URL endpoint = new URL(baseUrl + "/rest/v1/rpc/execute_notification_quick_action");

        HttpURLConnection conn = (HttpURLConnection) endpoint.openConnection();
        conn.setRequestMethod("POST");
        conn.setConnectTimeout(4000);
        conn.setReadTimeout(4000);
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("apikey", anonKey);
        conn.setRequestProperty("Authorization", "Bearer " + anonKey);
        conn.setRequestProperty("Prefer", "return=representation");
        conn.setRequestProperty("Connection", "close");

        JSONObject body = new JSONObject();
        body.put("p_token", token);
        body.put("p_action", action);

        byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(bytes);
        }

        int code = conn.getResponseCode();
        BufferedReader reader = new BufferedReader(new InputStreamReader(
            code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
            StandardCharsets.UTF_8
        ));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        reader.close();
        conn.disconnect();

        String response = sb.toString();
        if (code < 200 || code >= 300) {
            throw new Exception(extractErrorMessage(response));
        }
        return new JSONObject(response);
    }

    private static String extractErrorMessage(String response) {
        try {
            JSONObject json = new JSONObject(response);
            if (json.has("message")) {
                return json.getString("message");
            }
            if (json.has("error")) {
                return json.getString("error");
            }
        } catch (Exception ignored) {
            // fall through
        }
        return response;
    }

    private void openApp(Context context, Intent source) {
        Intent launch = new Intent(context, MainActivity.class)
            .putExtra(MaktreeFirebaseMessagingService.EXTRA_URL, source.getStringExtra(MaktreeFirebaseMessagingService.EXTRA_URL))
            .putExtra(MaktreeFirebaseMessagingService.EXTRA_KIND, source.getStringExtra(MaktreeFirebaseMessagingService.EXTRA_KIND))
            .putExtra(MaktreeFirebaseMessagingService.EXTRA_NOTIFICATION_ID, source.getStringExtra(MaktreeFirebaseMessagingService.EXTRA_NOTIFICATION_ID))
            .putExtra(MaktreeFirebaseMessagingService.EXTRA_ACTION, source.getStringExtra(MaktreeFirebaseMessagingService.EXTRA_ACTION))
            .putExtra(MaktreeFirebaseMessagingService.EXTRA_TOKEN, source.getStringExtra(MaktreeFirebaseMessagingService.EXTRA_TOKEN))
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(launch);
    }
}

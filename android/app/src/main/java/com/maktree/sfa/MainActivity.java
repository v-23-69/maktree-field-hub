package com.maktree.sfa;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;

import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int STATUS_BAR_COLOR = Color.parseColor("#2563EB");
    private static String pendingNotificationUrl = null;
    private static String pendingQuickAction = null;
    private static String pendingQuickToken = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> false);

        createNotificationChannels();
        configureSystemBars();
        super.onCreate(savedInstanceState);
        configureSystemBars();
        captureNotificationIntent(getIntent());
    }

    @Override
    public void onResume() {
        super.onResume();
        configureSystemBars();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        captureNotificationIntent(intent);
        navigateIfReady();
    }

    @Override
    public void onStart() {
        super.onStart();
        configureSystemBars();
        navigateIfReady();
    }

    /** WebView below status bar — matches previous PWA layout (no extra logo strip). */
    private void configureSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        getWindow().setStatusBarColor(STATUS_BAR_COLOR);
        getWindow().setNavigationBarColor(Color.WHITE);

        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(false);
            controller.setAppearanceLightNavigationBars(true);
            controller.show(WindowInsetsCompat.Type.statusBars());
            controller.show(WindowInsetsCompat.Type.navigationBars());
        }
    }

    public static String consumePendingQuickAction() {
        String action = pendingQuickAction;
        pendingQuickAction = null;
        return action;
    }

    public static String consumePendingQuickToken() {
        String token = pendingQuickToken;
        pendingQuickToken = null;
        return token;
    }

    private void captureNotificationIntent(Intent intent) {
        if (intent == null) {
            return;
        }
        String url = intent.getStringExtra(MaktreeFirebaseMessagingService.EXTRA_URL);
        if (url != null && !url.isEmpty()) {
            pendingNotificationUrl = url.startsWith("/") ? url : ("/" + url);
        }
        String action = intent.getStringExtra(MaktreeFirebaseMessagingService.EXTRA_ACTION);
        if (action != null && !action.isEmpty()) {
            pendingQuickAction = action;
        }
        String token = intent.getStringExtra(MaktreeFirebaseMessagingService.EXTRA_TOKEN);
        if (token != null && !token.isEmpty()) {
            pendingQuickToken = token;
        }
    }

    private void navigateIfReady() {
        if (getBridge() == null) {
            return;
        }
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }

        if (pendingNotificationUrl != null) {
            final String hash = pendingNotificationUrl;
            pendingNotificationUrl = null;

            webView.post(() -> {
                webView.evaluateJavascript(
                    "window.location.hash='" + escapeJs(hash) + "';",
                    null
                );
                injectQuickActionBridge(webView);
            });
            return;
        }

        if (pendingQuickAction != null && pendingQuickToken != null) {
            injectQuickActionBridge(webView);
        }
    }

    private void injectQuickActionBridge(WebView webView) {
        if (pendingQuickAction == null || pendingQuickToken == null) {
            return;
        }

        final String action = pendingQuickAction;
        final String token = pendingQuickToken;
        pendingQuickAction = null;
        pendingQuickToken = null;

        webView.post(() ->
            webView.evaluateJavascript(
                "window.MaktreePushBridge={" +
                    "consumePendingQuickAction:function(){return '" + escapeJs(action) + "';}," +
                    "consumePendingQuickToken:function(){return '" + escapeJs(token) + "';}" +
                "};",
                null
            )
        );
    }

    private static String escapeJs(String value) {
        return value.replace("\\", "\\\\").replace("'", "\\'");
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) {
            return;
        }

        NotificationChannel alerts = new NotificationChannel(
            "maktree_alerts",
            "Maktree Alerts",
            NotificationManager.IMPORTANCE_HIGH
        );
        alerts.setDescription("Approvals, DCR, leave, and urgent updates");
        alerts.enableVibration(true);
        manager.createNotificationChannel(alerts);

        NotificationChannel activity = new NotificationChannel(
            "maktree_activity",
            "Maktree Activity",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        activity.setDescription("DCR submitted and general updates");
        manager.createNotificationChannel(activity);

        NotificationChannel reminders = new NotificationChannel(
            "maktree_reminders",
            "Maktree Reminders",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        reminders.setDescription("DCR reminders and scheduled alerts");
        manager.createNotificationChannel(reminders);

        NotificationChannel defaultChannel = new NotificationChannel(
            "fcm_default_channel",
            "General",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        manager.createNotificationChannel(defaultChannel);
    }
}

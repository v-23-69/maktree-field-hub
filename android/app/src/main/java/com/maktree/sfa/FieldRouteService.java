package com.maktree.sfa;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Records the MR route while Maktree stays in Recents.
 * A full swipe-away stops this service, which is intended.
 */
public class FieldRouteService extends Service {
    public static final String PREFS = "maktree_field_location";
    public static final String CHANNEL_ID = "maktree_field_route";
    private static final int NOTIFICATION_ID = 4701;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private boolean tracking = false;
    private long lastSentAt = 0L;

    private final LocationCallback locations = new LocationCallback() {
        @Override
        public void onLocationResult(LocationResult result) {
            Location location = result.getLastLocation();
            if (location == null) return;
            refreshNotification();
            long now = System.currentTimeMillis();
            if (now - lastSentAt < 12_000) return;
            lastSentAt = now;
            final double lat = location.getLatitude();
            final double lng = location.getLongitude();
            final float accuracy = location.getAccuracy();
            io.execute(() -> postFix(lat, lng, accuracy));
        }
    };

    private final Runnable gpsWatch = new Runnable() {
        @Override
        public void run() {
            refreshNotification();
            handler.postDelayed(this, 20_000);
        }
    };

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Location is used only while Maktree is open. If Android restarts this
        // service, satisfy the foreground contract and remove the notice at once.
        createChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle("Maktree")
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true)
            .build();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(NOTIFICATION_ID);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                manager.deleteNotificationChannel(CHANNEL_ID);
            }
        }
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean("enabled", false).apply();
        stopSelf();
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        tracking = false;
        handler.removeCallbacks(gpsWatch);
        LocationServices.getFusedLocationProviderClient(this).removeLocationUpdates(locations);
        io.shutdownNow();
        super.onDestroy();
    }

    private void requestUpdates() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
            && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        LocationRequest request = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 15_000L)
            .setMinUpdateIntervalMillis(10_000L)
            .setMinUpdateDistanceMeters(0f)
            .setWaitForAccurateLocation(false)
            .build();
        LocationServices.getFusedLocationProviderClient(this)
            .requestLocationUpdates(request, locations, Looper.getMainLooper());
    }

    private boolean gpsOn() {
        LocationManager manager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        if (manager == null) return false;
        try {
            return manager.isProviderEnabled(LocationManager.GPS_PROVIDER)
                || manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        } catch (Exception ignored) {
            return false;
        }
    }

    private void refreshNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private Notification buildNotification() {
        boolean on = gpsOn();
        Intent tap = on
            ? new Intent(this, MainActivity.class)
            : new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
        tap.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pending = PendingIntent.getActivity(
            this,
            on ? 2 : 3,
            tap,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pending)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentTitle(on ? "Maktree is recording your route" : "Turn on location")
            .setContentText(on
                ? "Your route is saved while Maktree stays in Recents."
                : "Location is off. Tap to turn it on.");
        if (!on) {
            builder.addAction(0, "Turn on location", pending);
        }
        return builder.build();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Field route",
            NotificationManager.IMPORTANCE_MIN
        );
        channel.setDescription("Route recording and the alert when location is off");
        manager.createNotificationChannel(channel);
    }

    private void postFix(double lat, double lng, float accuracy) {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        String url = prefs.getString("url", "");
        String anon = prefs.getString("anon", "");
        String access = prefs.getString("access", "");
        if (url.isEmpty() || anon.isEmpty() || access.isEmpty()) return;
        int code = sendScan(url, anon, access, lat, lng, accuracy);
        if (code == 401) {
            String refreshed = refreshAccess(url, anon, prefs.getString("refresh", ""));
            if (refreshed != null) {
                sendScan(url, anon, refreshed, lat, lng, accuracy);
            }
        }
    }

    private int sendScan(String base, String anon, String access, double lat, double lng, float accuracy) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(base + "/rest/v1/rpc/spot_scan").openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(12_000);
            conn.setReadTimeout(12_000);
            conn.setDoOutput(true);
            conn.setRequestProperty("apikey", anon);
            conn.setRequestProperty("Authorization", "Bearer " + access);
            conn.setRequestProperty("Content-Type", "application/json");
            byte[] body = String.format(
                Locale.US,
                "{\"p_lat\":%.7f,\"p_lng\":%.7f,\"p_accuracy\":%.1f}",
                lat,
                lng,
                accuracy
            ).getBytes(StandardCharsets.UTF_8);
            try (OutputStream out = conn.getOutputStream()) {
                out.write(body);
            }
            return conn.getResponseCode();
        } catch (Exception ignored) {
            return 0;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private String refreshAccess(String base, String anon, String refresh) {
        if (refresh == null || refresh.isEmpty()) return null;
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(base + "/auth/v1/token?grant_type=refresh_token").openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(12_000);
            conn.setReadTimeout(12_000);
            conn.setDoOutput(true);
            conn.setRequestProperty("apikey", anon);
            conn.setRequestProperty("Content-Type", "application/json");
            byte[] body = new JSONObject().put("refresh_token", refresh).toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream out = conn.getOutputStream()) {
                out.write(body);
            }
            if (conn.getResponseCode() < 200 || conn.getResponseCode() >= 300) return null;
            StringBuilder text = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) text.append(line);
            }
            JSONObject json = new JSONObject(text.toString());
            String access = json.optString("access_token", "");
            String nextRefresh = json.optString("refresh_token", refresh);
            if (access.isEmpty()) return null;
            getSharedPreferences(PREFS, MODE_PRIVATE).edit()
                .putString("access", access)
                .putString("refresh", nextRefresh)
                .apply();
            return access;
        } catch (Exception ignored) {
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}

package com.maktree.sfa;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.location.LocationManager;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "FieldLocation",
    permissions = {
        @Permission(
            strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION },
            alias = "location"
        ),
        @Permission(
            strings = { Manifest.permission.ACCESS_BACKGROUND_LOCATION },
            alias = "backgroundLocation"
        ),
        @Permission(
            strings = { Manifest.permission.POST_NOTIFICATIONS },
            alias = "notifications"
        )
    }
)
public class FieldLocationPlugin extends Plugin {
    @PluginMethod
    public void setSession(PluginCall call) {
        SharedPreferences.Editor editor = prefs().edit();
        editor.putString("url", call.getString("supabaseUrl", ""));
        editor.putString("anon", call.getString("anonKey", ""));
        editor.putString("access", call.getString("accessToken", ""));
        editor.putString("refresh", call.getString("refreshToken", ""));
        editor.apply();
        call.resolve();
    }

    @PluginMethod
    public void allow(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "afterAllow");
            return;
        }
        call.resolve(statusObject());
    }

    @PermissionCallback
    private void afterAllow(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            call.reject("Location permission is off");
            return;
        }
        call.resolve(statusObject());
    }

    @PluginMethod
    public void start(PluginCall call) {
        prefs().edit().putBoolean("enabled", true).apply();
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "afterNotifications");
            return;
        }
        askLocation(call);
    }

    @PermissionCallback
    private void afterNotifications(PluginCall call) {
        askLocation(call);
    }

    private void askLocation(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "afterLocation");
            return;
        }
        askBackground(call);
    }

    @PermissionCallback
    private void afterLocation(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            call.reject("Location permission is off");
            return;
        }
        askBackground(call);
    }

    private void askBackground(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 29 && getPermissionState("backgroundLocation") != PermissionState.GRANTED) {
            requestPermissionForAlias("backgroundLocation", call, "afterBackground");
            return;
        }
        launch(call);
    }

    @PermissionCallback
    private void afterBackground(PluginCall call) {
        launch(call);
    }

    private void launch(PluginCall call) {
        Intent intent = new Intent(getContext(), FieldRouteService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve(statusObject());
    }

    @PluginMethod
    public void stop(PluginCall call) {
        prefs().edit().putBoolean("enabled", false).apply();
        getContext().stopService(new Intent(getContext(), FieldRouteService.class));
        call.resolve();
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(statusObject());
    }

    @PluginMethod
    public void openLocationSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    private JSObject statusObject() {
        JSObject result = new JSObject();
        result.put("locationGranted", getPermissionState("location") == PermissionState.GRANTED);
        result.put("backgroundGranted", getPermissionState("backgroundLocation") == PermissionState.GRANTED);
        result.put("gpsEnabled", gpsOn());
        return result;
    }

    private boolean gpsOn() {
        LocationManager manager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        if (manager == null) return false;
        try {
            return manager.isProviderEnabled(LocationManager.GPS_PROVIDER)
                || manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        } catch (Exception ignored) {
            return false;
        }
    }

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(FieldRouteService.PREFS, Context.MODE_PRIVATE);
    }
}

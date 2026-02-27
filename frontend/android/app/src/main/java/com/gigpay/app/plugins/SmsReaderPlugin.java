package com.gigpay.app.plugins;

import android.Manifest;
import android.database.Cursor;
import android.net.Uri;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(name = "SmsReader", permissions = {
        @Permission(alias = "sms", strings = { Manifest.permission.READ_SMS })
})
public class SmsReaderPlugin extends Plugin {

    private static final String TAG = "SmsReaderPlugin";
    private static final int DEFAULT_LIMIT = 100;

    @PluginMethod
    public void readSms(PluginCall call) {
        if (getPermissionState("sms") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
            return;
        }
        readSmsFromInbox(call);
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState("sms") == com.getcapacitor.PermissionState.GRANTED) {
            readSmsFromInbox(call);
        } else {
            call.reject("SMS permission denied by user");
        }
    }

    private void readSmsFromInbox(PluginCall call) {
        int limit = call.getInt("limit", DEFAULT_LIMIT);
        // "after" is an ISO timestamp string — convert to epoch ms for date filtering
        String afterStr = call.getString("after", null);
        long afterMs = 0;

        if (afterStr != null && !afterStr.isEmpty()) {
            try {
                afterMs = java.time.Instant.parse(afterStr).toEpochMilli();
            } catch (Exception e) {
                Log.w(TAG, "Could not parse 'after' timestamp: " + afterStr, e);
            }
        }

        try {
            JSArray messages = new JSArray();
            Uri smsUri = Uri.parse("content://sms/inbox");

            // Build selection clause for incremental sync
            String selection = null;
            String[] selectionArgs = null;
            if (afterMs > 0) {
                selection = "date > ?";
                selectionArgs = new String[] { String.valueOf(afterMs) };
            }

            Cursor cursor = getContext().getContentResolver().query(
                    smsUri,
                    new String[] { "address", "body", "date" },
                    selection,
                    selectionArgs,
                    "date DESC");

            if (cursor != null) {
                int count = 0;
                while (cursor.moveToNext() && count < limit) {
                    JSObject msg = new JSObject();
                    msg.put("sender", cursor.getString(cursor.getColumnIndexOrThrow("address")));
                    msg.put("body", cursor.getString(cursor.getColumnIndexOrThrow("body")));
                    long epochMs = cursor.getLong(cursor.getColumnIndexOrThrow("date"));
                    msg.put("timestamp", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
                            .format(new java.util.Date(epochMs)));
                    messages.put(msg);
                    count++;
                }
                cursor.close();
            }

            JSObject result = new JSObject();
            result.put("messages", messages);
            result.put("count", messages.length());
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to read SMS inbox", e);
            call.reject("Failed to read SMS: " + e.getMessage());
        }
    }
}

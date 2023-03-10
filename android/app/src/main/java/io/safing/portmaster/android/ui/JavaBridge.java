package io.safing.portmaster.android.ui;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.net.VpnService;
import android.net.wifi.WifiManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import io.safing.portmaster.android.settings.Settings;
import io.safing.portmaster.android.ui.MainActivity;

@CapacitorPlugin(name = "JavaBridge")
public class JavaBridge extends Plugin {

  @PluginMethod()
  public void getAppSettings(PluginCall call) {
    final PackageManager pm = getActivity().getPackageManager();
    Set<String> disabledApps = Settings.getDisabledApps(getActivity());

    List<ApplicationInfo> packages = pm.getInstalledApplications(0);
    JSONArray list = new JSONArray();
    for (ApplicationInfo packageInfo : packages) {
      JSONObject obj = new JSONObject();
      try {
        obj.put("name", pm.getApplicationLabel(packageInfo).toString());
        obj.put("packageName", packageInfo.packageName);
        obj.put("enabled", !disabledApps.contains(packageInfo.packageName));
        obj.put("system", isSystemPackage(packageInfo));
      } catch (JSONException e) {
        e.printStackTrace();
      }
      list.put(obj);
    }
    JSObject obj = new JSObject();
    obj.put("apps", list);
    call.resolve(obj);
  }

  private boolean isSystemPackage(ApplicationInfo info) {
    return ((info.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
  }

  @PluginMethod()
  public void setAppSettings(PluginCall call) {
    JSArray array = call.getArray("apps");

    try {
      List<String> apps = array.toList();
      Set<String> appsSet = new HashSet<>();
      for (String packageName : apps) {
          appsSet.add(packageName);
      }
      Settings.setDisabledApps(getActivity(), appsSet);
    } catch (JSONException e) {
      e.printStackTrace();
    }
    call.resolve();
  }

  @PluginMethod()
  public void requestVPNPermission(PluginCall call) {
    MainActivity activity = (MainActivity) getActivity();
    Intent intent = VpnService.prepare(activity.getApplicationContext());
    if(intent != null) {
      // Request user permissions
      activity.startActivityForResult(intent, MainActivity.REQUEST_VPN_PERMISSION);
    }
    call.resolve();
  }

  @PluginMethod
  public void isVPNPermissionGranted(PluginCall call) throws JSONException {
    Intent intent = VpnService.prepare(getActivity().getApplicationContext());
    if(intent != null) {
      call.resolve(new JSObject("{\"granted\": false}"));
    } else {
      call.resolve(new JSObject("{\"granted\": true}"));
    }
  }

  @PluginMethod
  public void requestNotificationsPermission(PluginCall call) throws JSONException {
    MainActivity activity = (MainActivity) getActivity();
    activity.createNotificationChannel();
    call.resolve(new JSObject(String.format("{\"granted\": %s}", activity.isNotificationChannelCreated())));
  }

  @PluginMethod
  public void isNotificationPermissionGranted(PluginCall call) throws JSONException {
    MainActivity activity = (MainActivity) getActivity();
    call.resolve(new JSObject(String.format("{\"granted\": %s}", activity.isNotificationChannelCreated())));
  }

  @PluginMethod
  public void initEngine(PluginCall call) {
    // This should be called only from the welcome screen.
    MainActivity activity = (MainActivity) getActivity();
    activity.initEngine();
    call.resolve();

    // Don't show the welcome screen next time.
    Settings.setWelcomeScreenShowed(activity, true);
  }

  @PluginMethod
  public void shouldShowWelcomeScreen(PluginCall call) throws JSONException {
    boolean should = Settings.ShouldShowWelcomeScreen(getActivity());
    call.resolve(new JSObject(String.format("{\"show\": %s}", should)));
  }

  @PluginMethod
  public void openUrlInBrowser(PluginCall call) {
    try {
      String url = call.getString("url");
      Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
      this.getActivity().startActivity(browserIntent);
      call.resolve();
    }catch(Exception e) {
      e.printStackTrace();
      call.reject(e.getMessage());
    }
  }

  @PluginMethod
  public void isWifiEnabled(PluginCall call) {
    WifiManager wifiManager = (WifiManager) getActivity().getApplicationContext().getSystemService(Context.WIFI_SERVICE);

    try {
      String jsonString = String.format("{\"enabled\": %s}", wifiManager.isWifiEnabled() ? "true" : "false");
      call.resolve(new JSObject(jsonString));
    } catch (JSONException e) {
      call.reject("failed to get wifi status");
    }
  }
}

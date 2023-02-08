package io.safing.portmaster.android.ui;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;

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

  class ApplicationSetting {
    String name;
    String packageName;
    boolean enabled;

    ApplicationSetting(String name, String packageName, boolean enabled) {
      this.name = name;
      this.packageName = packageName;
      this.enabled = enabled;
    }
  }

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
}

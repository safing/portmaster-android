package io.safing.portmaster.android.settings;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;

import androidx.appcompat.app.AppCompatActivity;

import java.util.HashSet;
import java.util.Set;

import io.safing.portmaster.android.ui.MainActivity;

public class Settings {
  private static final String DISABLED_APPS_SETTINGS_KEY = "DisabledAppsSettingsKey";
  private static final String WELCOME_SCREEN_SHOWED = "WelcomeScreenShowedKey";

  public static Set<String> getDisabledApps(Context context) {
    SharedPreferences settings = PreferenceManager.getDefaultSharedPreferences(context);
    Set<String> disabledApps = settings.getStringSet(DISABLED_APPS_SETTINGS_KEY, new HashSet<>());
    return disabledApps;
  }

  public static void setDisabledApps(Context context, Set<String> disabledApps) {
    SharedPreferences settings = PreferenceManager.getDefaultSharedPreferences(context);
    SharedPreferences.Editor editor = settings.edit();
    editor.putStringSet(DISABLED_APPS_SETTINGS_KEY, disabledApps);
    editor.commit();
  }

  public static boolean ShouldShowWelcomeScreen(Context context) {
    SharedPreferences settings = PreferenceManager.getDefaultSharedPreferences(context);
    return !settings.getBoolean(WELCOME_SCREEN_SHOWED, false);
  }

  public static void setWelcomeScreenShowed(Context context, boolean showed) {
    SharedPreferences settings = PreferenceManager.getDefaultSharedPreferences(context);
    SharedPreferences.Editor editor = settings.edit();
    editor.putBoolean(WELCOME_SCREEN_SHOWED, showed);
    editor.commit();
  }
}

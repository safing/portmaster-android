package io.safing.portmaster.android.ui;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;

import org.json.JSONException;

public class GoPluginCall implements engine.PluginCall {

  private PluginCall call;
  private GoBridge plugin;

  public GoPluginCall(GoBridge plugin, PluginCall call) {
    this.call = call;
    this.plugin = plugin;
  }

  @Override
  public String getArgs() {
    return call.getData().toString();
  }

  @Override
  public boolean getBool(String s) {
    checkArgument(s);
    return call.getBoolean(s);
  }

  @Override
  public float getFloat(String s) {
    checkArgument(s);
    return call.getFloat(s);
  }

  @Override
  public int getInt(String s) {
    checkArgument(s);
    return call.getInt(s);
  }

  @Override
  public long getLong(String s) {
    checkArgument(s);
    Long result = call.getLong(s);
    if(result == null) {
      result = call.getInt(s).longValue();
    }
    return result;
  }

  @Override
  public String getString(String s) {
    checkArgument(s);
    return call.getString(s);
  }

  @Override
  public void resolve() {
    call.resolve();
  }

  @Override
  public void resolveJson(String obj) {
    try {
      call.resolve(new JSObject(obj));
    } catch (JSONException ex) {
      Log.v("GoPluginCall", ex.toString());
    }
  }

  @Override
  public void error(String err) {
      call.reject(escape(err));
  }

  private static String escape(String s){
    return s.replace("\\", "\\\\")
      .replace("\t", "\\t")
      .replace("\b", "\\b")
      .replace("\n", "\\n")
      .replace("\r", "\\r")
      .replace("\f", "\\f")
      .replace("\'", "\\'")
      .replace("\"", "\\\"");
  }

  @Override
  public void keepAlive(boolean keepAlive) {
    this.call.setKeepAlive(keepAlive);
  }

  @Override
  public void notify(String eventName, String data) throws JSONException {
    this.plugin.notifyListener(eventName, data);
  }

  private void checkArgument(String arg) {
    if(!this.call.hasOption(arg)) {
      throw new IllegalArgumentException("No argument with name: " + arg);
    }
  }
}

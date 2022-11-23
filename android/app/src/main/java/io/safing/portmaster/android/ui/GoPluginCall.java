package io.safing.portmaster.android.ui;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.MessageHandler;
import com.getcapacitor.PluginCall;

import org.json.JSONException;

public class GoPluginCall implements vpn.PluginCall {

  private PluginCall call;

  public GoPluginCall(PluginCall call) {
    this.call = call;
  }

  @Override
  public String getArgs() {
    return call.getData().toString();
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
}

package io.safing.portmaster.android.ui;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import io.safing.portmaster.android.ui.MainActivity;

@CapacitorPlugin(name = "JavaBridge")
public class JavaBridge extends Plugin {

  @PluginMethod()
  public void enableTunnel(PluginCall call) {
    MainActivity activity = (MainActivity) getActivity();
    activity.connectVPN();
    call.resolve();
  }

  @PluginMethod()
  public void disableTunnel(PluginCall call) {
    MainActivity activity = (MainActivity) getActivity();
    activity.disconnectVPN();
    call.resolve();
  }
}

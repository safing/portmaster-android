package io.safing.portmaster.android.util;

import android.content.Intent;
import android.net.VpnService;


import io.safing.portmaster.android.connectivity.PortmasterTunnelService;
import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.ui.MainActivity;

public class ToggleTunnel extends Function {

  private MainActivity activity;

  public ToggleTunnel(String name, MainActivity activity) {
    super(name);
    this.activity = activity;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    String command = parseArguments(args, String.class);
    this.toggle(command);
    return null;
  }

  public void toggle(String command) {
    // Check if VPN Service has permissions
    Intent intent = VpnService.prepare(activity.getApplicationContext());
    if(intent != null) {
      // Put the requested command
      intent.putExtra("command", command);
      // Request user permissions
      activity.startActivityForResult(intent, MainActivity.ENABLE_VPN);
      return;
    }

    // User already approved the permissions, send the command.
    intent = new Intent(activity, PortmasterTunnelService.class);
    intent.setAction(PortmasterTunnelService.COMMAND_PREFIX + command);
    activity.startService(intent);
  }
}

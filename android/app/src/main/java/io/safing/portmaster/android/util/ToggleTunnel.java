package io.safing.portmaster.android.util;

import android.content.Context;
import android.content.Intent;

import java.io.IOException;

import io.safing.portmaster.android.connectivity.PortmasterTunnelService;
import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.go_interface.Result;
import io.safing.portmaster.android.ui.MainActivity;

public class ToggleTunnel extends Function {

  private MainActivity context;

  public ToggleTunnel(String name, MainActivity context) {
    super(name);
    this.context = context;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    boolean enabled = parseArguments(args, boolean.class);
    if (enabled) {
      context.connectVPN();
    } else {
      context.disconnectVPN();
    }

    return null;
  }
}

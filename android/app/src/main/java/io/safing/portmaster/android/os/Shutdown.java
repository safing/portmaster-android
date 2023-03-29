package io.safing.portmaster.android.os;

import android.app.Activity;
import android.content.Intent;

import io.safing.portmaster.android.connectivity.PortmasterTunnelService;
import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.ui.MainActivity;

public class Shutdown extends Function {

  public Shutdown(String name) {
    super(name);
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    System.exit(0);
    return null;
  }

}

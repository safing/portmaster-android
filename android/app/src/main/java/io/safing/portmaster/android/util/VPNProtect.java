package io.safing.portmaster.android.util;

import android.net.VpnService;

import io.safing.portmaster.android.go_interface.Function;

public class VPNProtect extends Function {

  private VpnService service;

  public VPNProtect(String name, VpnService service) {
    super(name);
    this.service = service;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    int socketID = parseArguments(args, int.class);
    boolean success = service.protect(socketID);

    if(!success) {
      throw new RuntimeException("failed to protect socket");
    }
    return null;
  }
}

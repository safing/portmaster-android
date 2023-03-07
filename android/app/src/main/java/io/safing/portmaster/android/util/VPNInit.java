package io.safing.portmaster.android.util;

import io.safing.portmaster.android.connectivity.PortmasterTunnelService;
import io.safing.portmaster.android.go_interface.Function;

public class VPNInit extends Function {

  private PortmasterTunnelService service;

  public VPNInit(String name, PortmasterTunnelService service) {
    super(name);
    this.service = service;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    int fd = service.InitVPN();
    return toResultFromObject(fd);
  }
}

package io.safing.portmaster.android.os;

import android.net.NetworkCapabilities;

public class NetworkProxy implements engine.Network {
  private NetworkCapabilities network = null;

  public NetworkProxy(NetworkCapabilities network) {
    this.network = network;
  }

  @Override
  public boolean hasCapability(int capability) {
    return network.hasCapability(capability);
  }
}

package io.safing.portmaster.android.os;

import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import io.safing.portmaster.android.go_interface.Function;

public class NetworkInterfaces extends Function {

  public NetworkInterfaces(String name) {
    super(name);
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    List<NetworkInterface> interfaces = null;
    try {
      interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
    } catch (Exception e) {
      return null;
    }

    List<NetInterface> netInterfaces = new ArrayList<>();
    for (NetworkInterface nif : interfaces) {
      try {
        NetInterface inf = new NetInterface();
        inf.name = nif.getName();
        inf.index = nif.getIndex();
        inf.MTU = nif.getMTU();
        inf.multicast = nif.supportsMulticast();
        inf.loopback = true;
        inf.p2p = nif.isPointToPoint();
        inf.addresses = NetworkAddresses.getInterfaceAddresses(nif);
        netInterfaces.add(inf);
      } catch (Exception e) {
        continue;
      }
    }

    return toResultFromObject(netInterfaces);
  }
}

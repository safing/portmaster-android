package io.safing.portmaster.android.os;

import java.io.IOException;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.go_interface.Result;

public class NetworkAddresses extends Function {

  public NetworkAddresses(String name) {
    super(name);
  }

  public static List<Address> getInterfaceAddresses(NetworkInterface nif) {
    List<Address> addresses = new ArrayList<>();
    for (InterfaceAddress ia : nif.getInterfaceAddresses()) {
      String addr = ia.getAddress().getHostAddress();
      int index = addr.lastIndexOf("%");
      if (index > 0) {
        addr = addr.substring(0, index);
      }

      boolean isIPv6 = addr.contains(":");
      addresses.add(new Address(addr, ia.getNetworkPrefixLength(), isIPv6));
    }
    return addresses;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    List<NetworkInterface> interfaces = null;
    try {
      interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
    } catch (Exception e) {
      return null;
    }

    List<Address> addresses = new ArrayList<>();
    for (NetworkInterface nif : interfaces) {
      addresses.addAll(getInterfaceAddresses(nif));
    }

    return toResultFromObject(addresses);
  }

}

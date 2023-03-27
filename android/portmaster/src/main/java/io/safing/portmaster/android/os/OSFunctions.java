package io.safing.portmaster.android.os;

import io.safing.portmaster.android.go_interface.GoInterface;

public class OSFunctions {

  public static GoInterface get() {
    GoInterface osInterface = new GoInterface();
    osInterface.registerFunction(new NetworkInterfaces("GetNetworkInterfaces"));
    osInterface.registerFunction(new NetworkAddresses("GetNetworkAddresses"));
    osInterface.registerFunction(new PlatformInfo("GetPlatformInfo"));
    osInterface.registerFunction(new Shutdown("Shutdown"));
    return osInterface;
  }

}

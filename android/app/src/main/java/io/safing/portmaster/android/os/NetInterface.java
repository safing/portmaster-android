package io.safing.portmaster.android.os;

import java.util.ArrayList;
import java.util.List;

public class NetInterface {
  public String name;
  public int index;
  public int MTU;
  public boolean up;
  public boolean multicast;
  public boolean loopback;
  public boolean p2p;
  public List<Address> addresses = new ArrayList<>();
}

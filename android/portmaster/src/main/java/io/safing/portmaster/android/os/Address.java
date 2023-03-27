package io.safing.portmaster.android.os;

public class Address {
  public Address(String address, int prefixLength, boolean isIPv6) {
    this.addr = address;
    this.prefixLength = prefixLength;
    this.isIPv6 = isIPv6;
  }
  public String addr;
  public int prefixLength;
  public boolean isIPv6;
}

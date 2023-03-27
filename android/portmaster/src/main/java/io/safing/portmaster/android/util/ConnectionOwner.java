package io.safing.portmaster.android.util;

import android.net.ConnectivityManager;
import android.os.Build;
import android.os.Process;
import android.system.OsConstants;

import java.net.InetAddress;
import java.net.InetSocketAddress;

import io.safing.portmaster.android.go_interface.Function;

public class ConnectionOwner extends Function {

  public static class Connection {
    public int Protocol;
    public byte[] LocalIP;
    public int LocalPort;
    public byte[] RemoteIP;
    public int RemotePort;
  }

  ConnectivityManager connectivityManager;

  public ConnectionOwner(String name, ConnectivityManager connectivityManager) {
    super(name);
    this.connectivityManager = connectivityManager;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    Connection connection = parseArguments(args, Connection.class);

    if(connection.LocalIP == null || connection.LocalIP.length == 0) {
      throw new IllegalArgumentException("invalid local IP");
    }

    if(connection.RemoteIP == null || connection.RemoteIP.length == 0) {
      throw new IllegalArgumentException("invalid remote IP");
    }

    InetSocketAddress local = new InetSocketAddress(InetAddress.getByAddress(connection.LocalIP), connection.LocalPort);
    InetSocketAddress remote = new InetSocketAddress(InetAddress.getByAddress(connection.RemoteIP), connection.RemotePort);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      int uid = connectivityManager.getConnectionOwnerUid(connection.Protocol, local, remote);

      if(uid == Process.INVALID_UID) {
        throw new RuntimeException("invalid connection info");
      }

      return this.toResultFromObject(uid);

    } else {
      throw new RuntimeException("not implemented for android sdk < 29");
    }
  }
}

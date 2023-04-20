package io.safing.portmaster.android.connectivity;

import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;

import androidx.annotation.NonNull;

import engine.Engine;
import io.safing.portmaster.android.os.NetworkProxy;

public class NetworkCallbacks extends ConnectivityManager.NetworkCallback {
  @Override
  public void onAvailable(@NonNull Network network) {
    super.onAvailable(network);
    Engine.onNetworkConnected();
  }

  @Override
  public void onLost(@NonNull Network network) {
    super.onLost(network);
    Engine.onNetworkDisconnected();
  }

  @Override
  public void onCapabilitiesChanged(@NonNull Network network, @NonNull NetworkCapabilities networkCapabilities) {
    super.onCapabilitiesChanged(network, networkCapabilities);
    Engine.onNetworkCapabilitiesChanged(new NetworkProxy(networkCapabilities));
  }
}

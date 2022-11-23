package io.safing.portmaster.android.ui;

import android.content.Intent;
import android.net.VpnService;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;
import android.util.Log;

import io.safing.portmaster.android.connectivity.PortmasterTunnelService;
import tunnel.Tunnel;
public class MainActivity extends BridgeActivity {

  private static final int SERVICE_ACTION_CONNECT = 1;
  private static final int SERVICE_ACTION_DISCONNECT = 1;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(GoBridge.class);
    registerPlugin(JavaBridge.class);
    super.onCreate(savedInstanceState);
    Log.v("Class ID", PortmasterTunnelService.class.getName());
  }

  public void connectVPN() {
    Intent intent = VpnService.prepare(getApplicationContext());

    if (intent != null) {
      // if we have an intent we need to ask the user for permission
      // first
      bridge.getActivity().startActivityForResult(intent, SERVICE_ACTION_CONNECT);
    } else {
      onActivityResult(SERVICE_ACTION_CONNECT, RESULT_OK, null);
    }
  }

  public void disconnectVPN() {
    Intent intent = VpnService.prepare(getApplicationContext());

    if (intent != null) {
      // if we have an intent we need to ask the user for permission
      // first
      bridge.getActivity().startActivityForResult(intent, SERVICE_ACTION_DISCONNECT);
    } else {
      onActivityResult(SERVICE_ACTION_DISCONNECT, RESULT_OK, null);
    }
  }

  public boolean isActive() {
    return Tunnel.isActive();
  }

  @Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    if (resultCode == RESULT_OK) {
      Intent startIntent = new Intent(this, PortmasterTunnelService.class);
      if(Tunnel.isActive()) {
        startIntent.setAction(PortmasterTunnelService.ACTION_DISCONNECT);
      } else {
        startIntent.setAction(PortmasterTunnelService.ACTION_CONNECT);
      }
      startService(startIntent);
    }
  }
}

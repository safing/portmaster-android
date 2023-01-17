package io.safing.portmaster.android.ui;

import android.content.Intent;
import android.net.Uri;
import android.net.VpnService;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;
import android.util.Log;

import io.safing.portmaster.android.connectivity.PortmasterTunnelService;
import io.safing.portmaster.android.go_interface.GoInterface;
import io.safing.portmaster.android.util.AppDir;
import io.safing.portmaster.android.util.NetworkAddresses;
import io.safing.portmaster.android.util.NetworkInterfaces;
import io.safing.portmaster.android.util.DebugInfoDialog;
import io.safing.portmaster.android.util.PlatformInfo;
import tunnel.Tunnel;
public class MainActivity extends BridgeActivity {

  private static final int SERVICE_ACTION_CONNECT = 1;
  private static final int SERVICE_ACTION_DISCONNECT = 2;
  private static final int EXPORT_DEBUG_INFO = 3;

  // Function objects that are called from go
  private AppDir getAppDirFunction = new AppDir("GetAppDataDir", this);
  private NetworkInterfaces getNetworkInterfacesFunction = new NetworkInterfaces("GetNetworkInterfaces");
  private NetworkAddresses getNetworkAddressesFunction = new NetworkAddresses("GetNetworkAddresses");
  private DebugInfoDialog getDebugInfoDialogFunction = new DebugInfoDialog("ExportDebugInfo", this, EXPORT_DEBUG_INFO);
  private PlatformInfo getPlatformInfoFunction = new PlatformInfo("GetPlatformInfo");

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(GoBridge.class);
    registerPlugin(JavaBridge.class);
    super.onCreate(savedInstanceState);
    Log.v("Class ID", PortmasterTunnelService.class.getName());

    GoInterface goInterface = new GoInterface();
    goInterface.registerFunction(getAppDirFunction);
    goInterface.registerFunction(getNetworkInterfacesFunction);
    goInterface.registerFunction(getNetworkAddressesFunction);
    goInterface.registerFunction(getDebugInfoDialogFunction);
    goInterface.registerFunction(getPlatformInfoFunction);

    tunnel.Tunnel.onCreate(goInterface);
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    tunnel.Tunnel.onDestroy();
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

    if (resultCode != RESULT_OK) {
      return;
    }

    Intent startIntent = new Intent(this, PortmasterTunnelService.class);
    if(requestCode == SERVICE_ACTION_CONNECT) {
      startIntent.setAction(PortmasterTunnelService.ACTION_CONNECT);
      startService(startIntent);
    } else if (requestCode == SERVICE_ACTION_DISCONNECT) {
      startIntent.setAction(PortmasterTunnelService.ACTION_DISCONNECT);
      startService(startIntent);
    }


    if(requestCode == EXPORT_DEBUG_INFO) {
      Uri uri = data.getData();
      getDebugInfoDialogFunction.writeToFile(uri);
    }

  }
}

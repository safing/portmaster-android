package io.safing.portmaster.android.ui;

import android.content.Intent;
import android.net.Uri;
import android.net.VpnService;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;
import android.util.Log;

import engine.Engine;
import io.safing.portmaster.android.connectivity.PortmasterTunnelService;
import io.safing.portmaster.android.go_interface.GoInterface;
import io.safing.portmaster.android.util.AppDir;
import io.safing.portmaster.android.util.NetworkAddresses;
import io.safing.portmaster.android.util.NetworkInterfaces;
import io.safing.portmaster.android.util.DebugInfoDialog;
import io.safing.portmaster.android.util.PlatformInfo;
import io.safing.portmaster.android.util.ToggleTunnel;
import io.safing.portmaster.android.util.UIEvent;
import tunnel.Tunnel;
public class MainActivity extends BridgeActivity {

  public static final int SERVICE_ACTION_CONNECT = 1;
  public static final int SERVICE_ACTION_DISCONNECT = 2;
  public static final int EXPORT_DEBUG_INFO = 3;

  // Function objects that are called from go
  private ToggleTunnel toggleTunnel;
  private AppDir getAppDirFunction;
  private NetworkInterfaces getNetworkInterfacesFunction;
  private NetworkAddresses getNetworkAddressesFunction;
  private DebugInfoDialog getDebugInfoDialogFunction;
  private PlatformInfo getPlatformInfoFunction;
  private UIEvent sendUIEvent;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(GoBridge.class);
    registerPlugin(JavaBridge.class);
    super.onCreate(savedInstanceState);
    Log.v("Class ID", PortmasterTunnelService.class.getName());

    this.toggleTunnel = new ToggleTunnel("ToggleTunnel", this);
    this.getAppDirFunction = new AppDir("GetAppDataDir", this);
    this.getNetworkInterfacesFunction = new NetworkInterfaces("GetNetworkInterfaces");
    this.getNetworkAddressesFunction = new NetworkAddresses("GetNetworkAddresses");
    this.getDebugInfoDialogFunction = new DebugInfoDialog("ExportDebugInfo", this, EXPORT_DEBUG_INFO);
    this.getPlatformInfoFunction = new PlatformInfo("GetPlatformInfo");
    this.sendUIEvent = new UIEvent("SendUIEvent", this.getBridge());

    GoInterface goInterface = new GoInterface();
    goInterface.registerFunction(this.toggleTunnel);
    goInterface.registerFunction(this.getAppDirFunction);
    goInterface.registerFunction(this.getNetworkInterfacesFunction);
    goInterface.registerFunction(this.getNetworkAddressesFunction);
    goInterface.registerFunction(this.getDebugInfoDialogFunction);
    goInterface.registerFunction(this.getPlatformInfoFunction);
    goInterface.registerFunction(this.sendUIEvent);

    Engine.onCreate(goInterface);
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    Engine.onDestroy();
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

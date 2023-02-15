package io.safing.portmaster.android.ui;

// DO NOT EDIT THIS FILE!
// The file was autogenerated by go/codegen/gen.go

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

@CapacitorPlugin(name = "GoBridge")
public class GoBridge extends Plugin {

    @PluginMethod()
    public void EnableSPN(PluginCall call) {
        engine.Engine.enableSPN(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void DisableSPN(PluginCall call) {
        engine.Engine.disableSPN(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void EnableTunnel(PluginCall call) {
        engine.Engine.enableTunnel(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void DisableTunnel(PluginCall call) {
        engine.Engine.disableTunnel(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void RestartTunnel(PluginCall call) {
        engine.Engine.restartTunnel(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void GetTunnelStatus(PluginCall call) {
        engine.Engine.getTunnelStatus(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void GetUser(PluginCall call) {
        engine.Engine.getUser(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void Login(PluginCall call) {
        engine.Engine.login(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void Logout(PluginCall call) {
        engine.Engine.logout(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void UpdateUserInfo(PluginCall call) {
        engine.Engine.updateUserInfo(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void GetSPNStatus(PluginCall call) {
        engine.Engine.getSPNStatus(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void GetLogs(PluginCall call) {
        engine.Engine.getLogs(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void GetDebugInfoFile(PluginCall call) {
        engine.Engine.getDebugInfoFile(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void DatabaseSubscribe(PluginCall call) {
        engine.Engine.databaseSubscribe(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void CancelAllSubscriptions(PluginCall call) {
        engine.Engine.cancelAllSubscriptions(new GoPluginCall(this, call));
    }    

    @PluginMethod()
    public void RemoveSubscription(PluginCall call) {
        engine.Engine.removeSubscription(new GoPluginCall(this, call));
    }    

    public void notifyListener(String name, String data) throws JSONException {
	    notifyListeners(name, new JSObject(data));
    }
}

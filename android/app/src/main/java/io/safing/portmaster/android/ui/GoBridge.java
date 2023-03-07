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
		exported.Exported.enableSPN(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void DisableSPN(PluginCall call) {
		exported.Exported.disableSPN(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void IsTunnelActive(PluginCall call) {
		exported.Exported.isTunnelActive(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void EnableTunnel(PluginCall call) {
		exported.Exported.enableTunnel(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void RestartTunnel(PluginCall call) {
		exported.Exported.restartTunnel(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void GetUser(PluginCall call) {
		exported.Exported.getUser(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void Login(PluginCall call) {
		exported.Exported.login(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void Logout(PluginCall call) {
		exported.Exported.logout(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void UpdateUserInfo(PluginCall call) {
		exported.Exported.updateUserInfo(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void GetSPNStatus(PluginCall call) {
		exported.Exported.getSPNStatus(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void GetLogs(PluginCall call) {
		exported.Exported.getLogs(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void GetDebugInfoFile(PluginCall call) {
		exported.Exported.getDebugInfoFile(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void GetDebugInfo(PluginCall call) {
		exported.Exported.getDebugInfo(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void DatabaseSubscribe(PluginCall call) {
		exported.Exported.databaseSubscribe(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void CancelAllSubscriptions(PluginCall call) {
		exported.Exported.cancelAllSubscriptions(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void RemoveSubscription(PluginCall call) {
		exported.Exported.removeSubscription(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void Shutdown(PluginCall call) {
		exported.Exported.shutdown(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void CreateIssue(PluginCall call) {
		exported.Exported.createIssue(new GoPluginCall(this, call));
	}

	@PluginMethod()
	public void CreateTicket(PluginCall call) {
		exported.Exported.createTicket(new GoPluginCall(this, call));
	}

	public void notifyListener(String name, String data) throws JSONException {
		notifyListeners(name, new JSObject(data));
	}
}

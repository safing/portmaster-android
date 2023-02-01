package io.safing.portmaster.android.util;

import com.getcapacitor.Bridge;


import io.safing.portmaster.android.go_interface.Function;

public class UIEvent extends Function {

  private Bridge bridge;

  public static class Event {
    public Event() {}
    public String Name;
    public String Target;
    public String Data;
  }

  public UIEvent(String name, Bridge bridge) {
    super(name);
    this.bridge = bridge;
  }

  @Override
  public byte[] call(byte[] data) throws Exception {
    Event args = this.parseArguments(data, Event.class);
    this.bridge.triggerJSEvent(args.Name, args.Target, args.Data);
    return null;
  }
}

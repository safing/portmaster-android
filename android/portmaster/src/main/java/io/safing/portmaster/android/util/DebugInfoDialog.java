package io.safing.portmaster.android.util;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;

import io.safing.portmaster.android.go_interface.Function;
import io.safing.portmaster.android.go_interface.Result;

public class DebugInfoDialog extends Function {

  static class Args {
    public String Filename;
    public byte[] Content;
  }

  private int activityID;
  private Activity activity;
  private byte[] content;

  public DebugInfoDialog(String name, Activity activity, int activityID) {
    super(name);
    this.activity = activity;
    this.activityID = activityID;
  }

  @Override
  public byte[] call(byte[] args) throws Exception {
    Args parsedArgs = this.parseArguments(args, Args.class);
    String filename = parsedArgs.Filename;
    this.content = parsedArgs.Content;

    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType("text/plain");
    intent.putExtra(Intent.EXTRA_TITLE, filename);
    activity.startActivityForResult(intent, this.activityID);

    return null;
  }

  public void writeToFile(Uri uri) {
    OutputStream output = null;
    try {
      output = activity.getContentResolver().openOutputStream(uri);
      output.write(this.content);
      output.close();
    } catch (IOException e) {
      e.printStackTrace();
    }
  }
}

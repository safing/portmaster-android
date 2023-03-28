package io.safing.portmaster.android.codegeneration;


import static org.junit.Assert.*;

import android.content.Context;

import com.getcapacitor.PluginMethod;
import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.StringReader;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import io.safing.portmaster.android.ui.GoPluginCall;
import io.safing.portmaster.android.ui.MainActivity;


/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */

public class GoInterfaceGenerator {

  class GoFunction {
      String name;
      public GoFunction(String name) {
        this.name = name;
      }
  }


  private String fileName = "src/main/java/io/safing/portmaster/android/ui/GoBridge.java";
  String newLine = System.getProperty("line.separator");


  private String template = String.join(newLine,
      "package io.safing.portmaster.android.ui;",
      "",
      "// DO NOT EDIT THIS FILE!",
      "// The file was autogenerated by {{testName}}",
      "",
      "import com.getcapacitor.JSObject;",
      "import com.getcapacitor.Plugin;",
      "import com.getcapacitor.PluginCall;",
      "import com.getcapacitor.PluginMethod;",
      "import com.getcapacitor.annotation.CapacitorPlugin;",
      "",
      "@CapacitorPlugin(name = \"GoBridge\")",
      "public class GoBridge extends Plugin {",
      "{{#methods}}",
      "",
      "    @PluginMethod()",
      "    public void {{name}}(PluginCall call) {",
      "        tunnel.Tunnel.{{name}}(new GoPluginCall(call));",
      "    }",
      "{{/methods}}",
      "}"
      );


  private boolean isUIFunction(Method m) {
    if((m.getModifiers() & Modifier.STATIC) == 0) {
      return false;
    }

    if(m.getParameterCount() != 1 ) {
      return false;
    }

    return m.getParameterTypes()[0] == tunnel.PluginCall.class;
  }

  @Test
  public void generate() throws Exception {
    File file = new File(fileName);
    boolean a = file.createNewFile();

    HashMap<String, Object> scopes = new HashMap<String, Object>();
    scopes.put("testName", this.getClass().getName());

    List<GoFunction> list = new LinkedList<>();
    for(Method method : tunnel.Tunnel.class.getMethods()) {
      if (isUIFunction(method)) {
        list.add(new GoFunction(method.getName()));
      }
    }
    scopes.put("methods", list);

    MustacheFactory mf = new DefaultMustacheFactory();
    Mustache mustache = mf.compile(new StringReader(template), "ui-bridge");

    BufferedWriter writer = new BufferedWriter(new FileWriter(fileName));
    mustache.execute(writer, scopes);

    writer.close();
  }
}
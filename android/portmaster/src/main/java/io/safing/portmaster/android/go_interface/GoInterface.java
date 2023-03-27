package io.safing.portmaster.android.go_interface;

import android.content.Context;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.cbor.databind.CBORMapper;

import java.util.HashMap;


public class GoInterface implements app_interface.AppInterface {

  private Context context;
  private ObjectMapper mapper = new CBORMapper();

  private HashMap<String, Function> functions = new HashMap<>();


  public void registerFunction(Function func) {
    this.functions.put(func.getName(), func);
  }

  @Override
  public byte[] callFunction(String functionName, byte[] bytes) throws Exception {
    // Get requested function
    Function func = functions.get(functionName);
    // Call the requested function if found and extract the result
    if(func == null) {
      throw new RuntimeException("function " + functionName + " not implemented");
    }

    return func.call(bytes);
  }
}

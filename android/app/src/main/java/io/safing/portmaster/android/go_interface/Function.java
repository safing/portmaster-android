package io.safing.portmaster.android.go_interface;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.cbor.databind.CBORMapper;

import java.nio.charset.StandardCharsets;

public abstract class Function {
  private String name;
  private ObjectMapper mapper = new CBORMapper();

  protected Function(String name) {
    this.name = name;
  }

  public String getName() {
    return name;
  }

  protected Result toResultFromObject(Object obj) {
    String error = null;
    byte[] data = null;
    try {
      data = this.mapper.writeValueAsBytes(obj);
    } catch (JsonProcessingException e) {
      e.printStackTrace();
      error = "failed to convert to CDOR: " + e.getMessage();
    }

    return new Result(data, error);
  }

  protected Result toResultFromString(String str) {
    return new Result(str.getBytes(StandardCharsets.UTF_8), null);
  }

  public abstract Result call(byte[] args);
}

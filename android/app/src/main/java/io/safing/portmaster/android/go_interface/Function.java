package io.safing.portmaster.android.go_interface;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.cbor.databind.CBORMapper;

import java.io.IOException;
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

  protected byte[] toResultFromObject(Object obj) throws RuntimeException {
    byte[] data = null;
    try {
      data = this.mapper.writeValueAsBytes(obj);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("failed to convert to CDOR: " + e.getMessage());
    }

    return data;
  }

  public <T> T parseArguments(byte[] args, Class<T> valueType) throws Exception {
    return mapper.readValue(args, valueType);
  }

  public abstract byte[] call(byte[] args) throws Exception;
}

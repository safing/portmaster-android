package io.safing.portmaster.android.go_interface;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.cbor.databind.CBORMapper;

import java.nio.charset.StandardCharsets;

public class Result {
  public byte[] data;
  public String error;

  public Result(byte[] data, String error) {
    this.data = data;
    this.error = error;
  }
}

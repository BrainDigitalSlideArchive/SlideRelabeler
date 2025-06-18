export function encodeURLParameters(params) {
  let encodedParams = "";

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const encodedKey = encodeURIComponent(key);
      const json_encoded = JSON.stringify(params[key]);
      const utf8_bytes = new TextEncoder().encode(json_encoded);
      const encodedValue = btoa(String.fromCharCode(...utf8_bytes));

      if (encodedParams !== "") {
        encodedParams += "&";
      }

      encodedParams += `${encodedKey}=${encodedValue}`;
    }
  }

  return encodedParams;
}

export function decodeURLParameters(params) {
  let output = {}
  for (const [key, value] of params.entries()) {
    const decoded_key = decodeURIComponent(key);
    if (value) {
      const binary_string = atob(value);
      const uint8_array = new Uint8Array(binary_string.length);
      for (let i = 0; i < binary_string.length; i++) {
        uint8_array[i] = binary_string.charCodeAt(i);
      }
      const utf8_string = new TextDecoder('utf-8').decode(uint8_array)
      output[decoded_key] = JSON.parse(utf8_string);
    }
  }

  return output
}
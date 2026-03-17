export function encodeURLParameters(params) {
  let encodedParams = "";

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const encodedKey = encodeURIComponent(key);
      const json_encoded = JSON.stringify(params[key]);
      const utf8_bytes = new TextEncoder().encode(json_encoded);
      // Base64 can contain '+', '/', '=' which are unsafe in raw query strings.
      // URL-encode the base64 payload so URLSearchParams round-trips reliably.
      const encodedValue = encodeURIComponent(btoa(String.fromCharCode(...utf8_bytes)));

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
      // Values are URL-encoded base64; decode once before atob.
      const normalized_value = decodeURIComponent(value);
      const binary_string = atob(normalized_value);
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
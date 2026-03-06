const PROTO_VALUE_KEYS = [
  "nullValue",
  "numberValue",
  "stringValue",
  "boolValue",
  "structValue",
  "listValue",
];

function getWrappedKind(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  // protobufjs/proto-loader sometimes keeps oneof marker in "kind"
  if (
    typeof value.kind === "string" &&
    PROTO_VALUE_KEYS.includes(value.kind) &&
    Object.prototype.hasOwnProperty.call(value, value.kind)
  ) {
    return value.kind;
  }

  const present = PROTO_VALUE_KEYS.filter((key) =>
    Object.prototype.hasOwnProperty.call(value, key),
  );
  if (present.length === 1) return present[0];

  return null;
}

export function protoValueToJs(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => protoValueToJs(item));
  if (typeof value !== "object") return value;

  const kind = getWrappedKind(value);
  if (kind) {
    switch (kind) {
      case "nullValue":
        return null;
      case "numberValue":
      case "stringValue":
      case "boolValue":
        return value[kind];
      case "structValue":
        return protoStructToJs(value.structValue);
      case "listValue": {
        const raw = value.listValue;
        const values = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.values)
            ? raw.values
            : [];
        return values.map((item) => protoValueToJs(item));
      }
      default:
        return null;
    }
  }

  // Support receiving a bare Struct shape directly.
  if (Object.prototype.hasOwnProperty.call(value, "fields")) {
    return protoStructToJs(value);
  }

  // Plain object fallback.
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = protoValueToJs(val);
  }
  return out;
}

export function protoStructToJs(struct) {
  if (!struct || typeof struct !== "object") return {};
  const fields = struct.fields && typeof struct.fields === "object" ? struct.fields : struct;
  const out = {};
  for (const [key, val] of Object.entries(fields)) {
    out[key] = protoValueToJs(val);
  }
  return out;
}

export const structToObject = protoStructToJs;

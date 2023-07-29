// utils.js
export function flattenJSON(obj, parentKey = "", result = {}) {
  for (const key in obj) {
    const combinedKey = parentKey ? `${parentKey}_${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      flattenJSON(obj[key], combinedKey, result);
    } else {
      result[combinedKey] = obj[key];
    }
  }
  return result;
}


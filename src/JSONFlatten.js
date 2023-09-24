// Flatten any field in a CSV file containing JSON data
const flattenProperties = (data, prefix = '') => {
  const flattenedData = {};

  const flattenObject = (obj, parentKey = '') => {
    for (const key in obj) {
      const value = obj[key];
      const newKey = parentKey ? `${parentKey}_${key}` : key;

      if (typeof value === 'object' && value !== null) {
        // Recursively flatten nested objects
        flattenObject(value, newKey);
      } else {
        flattenedData[newKey] = value;
      }
    }
  };

  try {
    const parsedData = JSON.parse(data);
    flattenObject(parsedData, prefix);
  } catch (error) {
    console.warn('Error parsing JSON in flattenProperties for data:', data, 'Error:', error);
    // Treat the data as a simple key-value pair
    const [key, value] = data.split(':').map((item) => item.trim());
    const newKey = prefix ? `${prefix}_${key}` : key;
    flattenedData[newKey] = value;
  }

  return flattenedData;
};

const mergeRow = (flattenedProperties, originalRow) => {
  const newRow = { ...originalRow };

  // Check if the PROPERTIES column exists in the originalRow and is a valid JSON string
  if (originalRow.hasOwnProperty('PROPERTIES')) {
    let properties;
    try {
      properties = JSON.parse(originalRow.PROPERTIES);
    } catch (error) {
      console.warn('Error parsing PROPERTIES column:', error);
      properties = null;
    }

    if (properties && typeof properties === 'object') {
      // Merge properties object with newRow, handling nested objects
      const mergeObjects = (obj, parentKey = '') => {
        for (const key in obj) {
          const value = obj[key];
          const newKey = parentKey ? `${parentKey}_${key}` : key;

          if (typeof value === 'object' && value !== null) {
            mergeObjects(value, newKey);
          } else {
            newRow[newKey] = value;
          }
        }
      };
      mergeObjects(properties);
    }
  }

  // Merge flattenedProperties into newRow
  for (const key in flattenedProperties) {
    newRow[key] = flattenedProperties[key];
  }

  return newRow;
};

export { flattenProperties, mergeRow };
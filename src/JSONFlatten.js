
import React, { useState } from 'react';
import Papa from 'papaparse';
import axios from 'axios';

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
    try {
      const properties = JSON.parse(originalRow.PROPERTIES);
      if (typeof properties === 'object' && properties !== null) {
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
    } catch (error) {
      console.warn('Error parsing PROPERTIES column:', error);
    }
  }

  // Merge flattenedProperties into newRow
  for (const key in flattenedProperties) {
    newRow[key] = flattenedProperties[key];
  }

  return newRow;
};


const CSVProcessor = () => {
  const [inputFile, setInputFile] = useState(null);
  const [outputFileLink, setOutputFileLink] = useState(null);

  const processCSV = async () => {
    if (!inputFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target.result;
      const rows = Papa.parse(csvData, { header: true }).data;

      const uniqueRows = new Set();
      const outputRows = [];

      for (const row of rows) {
        const properties = row.PROPERTIES;
        const flattenedProperties = flattenProperties(properties);

        const newRow = mergeRow(flattenedProperties, row);

        delete newRow.PROPERTIES;

        const rowString = JSON.stringify(newRow);
        if (!uniqueRows.has(rowString)) {
          uniqueRows.add(rowString);
          outputRows.push(newRow);
        }
      }

      const csvOutput = Papa.unparse(outputRows);
      const blob = new Blob([csvOutput], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      setOutputFileLink(url);
    };

    reader.readAsText(inputFile);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setInputFile(file);
  };

  const downloadOutputCSV = () => {
    if (outputFileLink) {
      axios.get(outputFileLink, { responseType: 'blob' }).then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'output.csv');
        document.body.appendChild(link);
        link.click();
      });
    }
  };

  return (
    <div>
      <h1>CSV Processor</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={processCSV}>Process CSV</button>
      {outputFileLink && (
        <div>
          <p>CSV file has been flattened!</p>
          <button onClick={downloadOutputCSV}>Download Output CSV</button>
        </div>
      )}
    </div>
  );
};

export default CSVProcessor;

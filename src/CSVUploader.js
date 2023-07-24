// CSVUploader.js
import React from "react";

const CSVUploader = ({ onFileUpload }) => {
  const handleUpload = (event) => {
    const file = event.target.files[0];
    onFileUpload(file);
  };

  return (
    <div className="upload-container">
      <h2>Upload CSV</h2>
      <input type="file" accept=".csv" onChange={handleUpload} />
    </div>
  );
};

export default CSVUploader;


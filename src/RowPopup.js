// RowPopup.js
import React from "react";

const RowPopup = ({ headers, rowData, renamedHeaders, hiddenColumns, onClose }) => {
  const visibleHeaders = headers.filter((header) => !hiddenColumns.includes(header));

  return (
    <div className="row-popup-container">
      <button className="close-btn" onClick={onClose}>
        Close
      </button>
      <table>
        <tbody>
          {visibleHeaders.map((header) => (
            <tr key={header}>
              <th style={{ maxWidth: 100, wordWrap: "break-word" }}>
                {renamedHeaders[header] || header}
              </th>
              <td style={{ maxWidth: 200, wordWrap: "break-word" }}>{rowData[header]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RowPopup;


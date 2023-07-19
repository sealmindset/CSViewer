import React from "react";
import "./RowPopup.css";

const RowPopup = ({ headers, rowData, onClose }) => {
  return (
    <div className="row-popup-container">
      <button className="close-btn" onClick={onClose}>
        Close
      </button>
      <table>
        <tbody>
          {headers.map((header) => (
            <tr key={header}>
              <th>{header}</th>
              <td>{rowData[header]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RowPopup;


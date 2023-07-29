import React, { useEffect, useRef, useState } from "react";
import "./RowPopup.css";

const RowPopup = ({ headers, rowData, renamedHeaders, hiddenColumns, onClose }) => {
  const visibleHeaders = headers.filter((header) => !hiddenColumns.includes(header));
  const textMeasureRef = useRef(null);
  const [charWidth, setCharWidth] = useState(0);

  useEffect(() => {
    // Calculate the width of 100 characters
    if (textMeasureRef.current) {
      const textWidth = textMeasureRef.current.offsetWidth;
      setCharWidth(textWidth / 100);
    }
  }, []);

  return (
    <div className="row-popup-container">
      <button className="close-btn" onClick={onClose}>
        Close
      </button>
      <div className="table-container" style={{ width: `${100 * charWidth * 2 + 40}px` }}>
        <table style={{ width: `${100 * charWidth * 2}px` }}>
          <tbody>
            {visibleHeaders.map((header) => (
              <tr key={header}>
                <th style={{ maxWidth: `${100 * charWidth}px`, wordWrap: "break-word" }}>
                  {renamedHeaders[header] || header}
                </th>
                <td style={{ maxWidth: `${256 * charWidth}px`, wordWrap: "break-word" }}>
                  {rowData[header]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div ref={textMeasureRef} id="text-measure" style={{ visibility: "hidden" }}>
        {"x".repeat(100)}
      </div>
    </div>
  );
};

export default RowPopup;
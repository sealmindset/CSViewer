import React, { useEffect, useRef, useState } from "react";
import "./RowPopup.css";

const RowPopup = ({ headers, data: rowData, renamedHeaders, hiddenColumns, onClose }) => {
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
        <div className="table-container">
            <table>
                <tbody>
                    {visibleHeaders.map((header) => (
                        <tr key={header}>
                            <th className="header-cell">
                                {renamedHeaders[header] || header}
                            </th>
                            <td className="data-cell">
                                {rowData && rowData[header]}
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

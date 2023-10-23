import React, { useEffect, useRef, useState } from "react";
import "./RowPopup.css";

const RowPopup = ({ headers, data: rowData, renamedHeaders, hiddenColumns, onClose, onSave }) => {
  const visibleHeaders = headers.filter((header) => !hiddenColumns.includes(header));
  const textMeasureRef = useRef(null);
  const [charWidth, setCharWidth] = useState(0);
  const [charHeight, setCharHeight] = useState(0);
  const [editedData, setEditedData] = useState({ ...rowData });

  useEffect(() => {
    if (textMeasureRef.current) {
      const textWidth = textMeasureRef.current.offsetWidth;
      const textHeight = textMeasureRef.current.offsetHeight;
      setCharWidth(textWidth / 100);
      setCharHeight(textHeight / 10); // Assuming 10 rows in the measuring div
    }
  }, []);

  const handleSave = () => {
    onSave(editedData);
    onClose();
  };

  return (
    <div className="row-popup-container">
      <button className="close-btn" onClick={onClose}>
        Close
      </button>
      <button className="save-btn" onClick={handleSave}>
        Save
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
                  <textarea
                    cols={Math.min(768, Math.floor(768 / charWidth))}
                    style={{ height: `${charHeight * 10}px` }} // Assuming 10 rows
                    value={editedData[header] || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        [header]: e.target.value,
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div ref={textMeasureRef} id="text-measure" style={{ visibility: "hidden" }}>
        {"x".repeat(100)}
        <br />
        {"x".repeat(100)}
        <br />
        {"x".repeat(100)}
        <br />
        {"x".repeat(100)}
      </div>
    </div>
  );
};

export default RowPopup;

// ColumnToggle.js
import React from "react";

const ColumnToggle = ({ headers, renamedHeaders, hiddenColumns, onColumnToggle }) => {
  return (
    <div className="toggle-table-container">
      <table className="toggle-columns-table">
        <tbody>
          {headers.map((header) => (
            <tr key={header}>
              <td>
                <input
                  type="checkbox"
                  checked={!hiddenColumns.includes(header)}
                  onChange={() => onColumnToggle(header)}
                />
              </td>
              <td className="field-name-cell">
                <input
                  type="text"
                  value={renamedHeaders[header] || header}
                  onChange={(e) =>
                    onColumnToggle(renamedHeaders[header] || header, e.target.value)
                  }
                  maxLength={100}
                  style={{ width: "98%" }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ColumnToggle;


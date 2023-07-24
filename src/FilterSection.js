// FilterSection.js
import React from "react";

const FilterSection = ({
  headers,
  renamedHeaders,
  hiddenColumns,
  filterCriteria,
  searchTerms,
  dropdownOptions,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="filter-table-container">
      <table className="filter-table">
        <tbody>
          {headers.map((header) => (
            <React.Fragment key={header}>
              {!hiddenColumns.includes(header) && (
                <tr>
                  <td>
                    <span>{renamedHeaders[header] || header}:</span>
                  </td>
                  <td className="field-name-cell">
                    <input
                      type="text"
                      placeholder={`Search ${renamedHeaders[header] || header}`}
                      value={searchTerms[header] || ""}
                      onChange={(e) => onFilterChange(header, e.target.value)}
                      list={`datalist-${header}`}
                      maxLength={98}
                      size={95}
                    />
                    <datalist id={`datalist-${header}`}>
                      <option value="All" />
                      {dropdownOptions[header]?.map((value) => (
                        <option
                          key={value}
                          value={value}
                          style={{
                            width: "100%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {value.length > 100 ? `...${value.slice(-100)}` : value}
                        </option>
                      ))}
                    </datalist>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <button onClick={onReset}>Reset</button>
    </div>
  );
};

export default FilterSection;


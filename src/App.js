import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import DataTable from "react-data-table-component";
import { useDropzone } from "react-dropzone";
import Modal from "react-modal";
import RowPopup from "./RowPopup";
import { flattenProperties, mergeRow } from './JSONFlatten';
import "./App.css";

Modal.setAppElement("#root");

const App = () => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [renamedHeaders, setRenamedHeaders] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [initialState, setInitialState] = useState({});
  const [groupByColumns, setGroupByColumns] = useState({});
  const [selectedRowData, setSelectedRowData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupedData] = useState([]);

  // First useEffect for updating filter criteria
  useEffect(() => {
    setFilterCriteria((prevCriteria) => {
      const updatedCriteria = {};
      headers.forEach((header) => {
        const newColumn = renamedHeaders[header] || header;
        if (!hiddenColumns.includes(newColumn)) {
          updatedCriteria[newColumn] = prevCriteria[header];
        }
      });
      return updatedCriteria;
    });
  }, [renamedHeaders, hiddenColumns, headers, filterCriteria]);

  // Second useEffect for updating dropdown options
  useEffect(() => {
    setDropdownOptions((prevOptions) => {
      const updatedOptions = { ...prevOptions };
      headers.forEach((header) => {
        if (!hiddenColumns.includes(header)) {
          const searchTerm = searchTerms[header]?.toLowerCase();
          const allValues = Array.from(new Set(data.map((row) => row[header])));
          const filteredValues = allValues.filter(
            (value) => !searchTerm || value.toLowerCase().includes(searchTerm)
          );
          updatedOptions[header] = filteredValues;
        }
      });
      return updatedOptions;
    });
  }, [searchTerms, data, headers, hiddenColumns]);

  // Third useEffect for setting initial state
  useEffect(() => {
    setInitialState({
      renamedHeaders: { ...renamedHeaders },
      hiddenColumns: [...hiddenColumns], // Clone hiddenColumns as an array
      filterCriteria: { ...filterCriteria },
      searchTerms: { ...searchTerms },
    });
  }, [renamedHeaders, hiddenColumns, filterCriteria, searchTerms]);

  // Function to group and sort table data
  const groupAndSortTableData = useCallback((tableData) => {
    if (Object.keys(groupByColumns).length === 0) {
      return tableData;
    }

    const groups = {};
    tableData.forEach((row) => {
      const groupKey = Object.entries(groupByColumns)
        .map(([column, selected]) => (selected ? row[column] : ""))
        .join("-");
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(row);
    });

    // Sort the data based on the groupBy column and any additional sorting criteria
    return Object.values(groups).flat().sort((a, b) => {
      // Sort based on the first selected groupBy column
      const sortByColumn = Object.entries(groupByColumns).find(([column, selected]) => selected);
      if (sortByColumn) {
        const [sortBy] = sortByColumn;
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (!hiddenColumns.includes(sortBy)) {
          return aValue.localeCompare(bValue);
        }
      }
      return 0;
    });
  }, [groupByColumns, hiddenColumns]);

  // Function to handle file drop
  const handleDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const fileContent = event.target.result;
      if (file.name.endsWith(".csv")) {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const processedData = result.data.map(row => {
              if (row.PROPERTIES) {
                const flattenedProperties = flattenProperties(row.PROPERTIES);
                return mergeRow(flattenedProperties, row);
              }
              return row;
            });

            if (Array.isArray(processedData) && processedData.length > 0 && typeof processedData[0] === 'object') {
              setHeaders(Object.keys(processedData[0]));
            }

            setData(processedData);
            setRenamedHeaders({});
            setHiddenColumns([]);
            setFilterCriteria({});
            setSearchTerms({});
            setDropdownOptions({});
            setGroupByColumns({});
          },
        });
      } else if (file.name.endsWith(".json")) {
        const jsonData = JSON.parse(fileContent);

        if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object') {
          setHeaders(Object.keys(jsonData[0]));
        }

        setData(jsonData);
        setRenamedHeaders({});
        setHiddenColumns([]);
        setFilterCriteria({});
        setSearchTerms({});
        setDropdownOptions({});
        setGroupByColumns({});
      } else {
        alert("Unsupported file format. Please upload either CSV or JSON file.");
      }
    };

    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: ".csv, .json", // Allow both CSV and JSON files
    multiple: false,
  });

  const groupByColumn = "groupby";
  const updatedHeaders = [...headers.slice(0, 1), groupByColumn, ...headers.slice(1)];

  const columns = updatedHeaders.map((header) => ({
    name: renamedHeaders[header] || header,
    selector: header,
    sortable: true,
    wrap: true,
    format: (row) => {
      const value = row && row[header]; // Add a check for 'row'
      return value;
    },
    omit: header === groupByColumn || hiddenColumns.includes(header),
    grow: 1,
  }));

  const handleRowClick = (row) => {
    setSelectedRowData(row);
    setIsModalOpen(true);
  };

  const handleColumnToggle = (event, column) => {
    const isChecked = event.target.checked;
    setHiddenColumns((prevHiddenColumns) => {
      if (isChecked) {
        // If column is checked, remove it from hiddenColumns array
        return prevHiddenColumns.filter((hiddenColumn) => hiddenColumn !== column);
      } else {
        // If column is unchecked, add it to hiddenColumns array
        return [...prevHiddenColumns, column];
      }
    });
    setRenamedHeaders((prevRenamedHeaders) => {
      const updatedHeaders = { ...prevRenamedHeaders };
      if (!isChecked) {
        delete updatedHeaders[column];
      }
      return updatedHeaders;
    });
  };

  const handleGroupByToggle = (event, column) => {
    const isChecked = event.target.checked;
    setGroupByColumns((prevGroupByColumns) => ({
      ...prevGroupByColumns,
      [column]: isChecked,
    }));
  };

  // Define missing functions
  const handleReset = () => {
    setRenamedHeaders(initialState.renamedHeaders);
    setHiddenColumns(initialState.hiddenColumns);
    setFilterCriteria(initialState.filterCriteria);
    setSearchTerms(initialState.searchTerms);
    setGroupByColumns({});
  };

  const [isFileNameModalOpen, setIsFileNameModalOpen] = useState(false);
  const [selectedFileFormat, setSelectedFileFormat] = useState("");
  const [fileName, setFileName] = useState("");

  const promptFileName = (format) => {
    setSelectedFileFormat(format);
    setIsFileNameModalOpen(true);
  };

  const handleFileNameSubmit = () => {
    setIsFileNameModalOpen(false);
    if (fileName.trim() !== "") {
      handleDownload(selectedFileFormat, fileName);
    }
  };

  const handleDownload = (format, fileName) => {
    const visibleData = groupedData.map((row) =>
      headers.reduce((acc, header) => {
        if (!hiddenColumns.includes(header)) {
          const newColumn = renamedHeaders[header] || header;
          acc[newColumn] = row[header];
        }
        return acc;
      }, {})
    );

    let dataToExport, fileExtension;
    if (format === "csv") {
      dataToExport = Papa.unparse(visibleData, { header: true });
      fileExtension = "csv";
    } else if (format === "json") {
      dataToExport = JSON.stringify(visibleData, null, 2);
      fileExtension = "json";
    }

    const blob = new Blob([dataToExport], { type: `text/${fileExtension};charset=utf-8;` });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.${fileExtension}`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="App">
      {/* Section 1: Header or Title - CVS Table Display */}
      <div className="section section1">
        <h1>CVS | JSON Viewer</h1>
      </div>

      {/* Section 2: CVS File Input */}
      <div className="section section2">
        <div className="upload-container">
          <h2>Upload CSV|JSON Formatted File</h2>
          <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            <p>Drag 'n' drop a CSV or JSON file here, or click to select a file</p>
          </div>
        </div>
      </div>

      {/* Section 3: Toggle Section */}
      <div className="section toggle-section">
        <div className="toggle-table-container">
          <table className="toggle-columns-table">
            <tbody>
              {Array.isArray(headers) && headers.map((header) => (
                <tr key={header}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.includes(header)}
                      onChange={(e) => handleColumnToggle(e, header)}
                    />
                  </td>
                  <td className="field-name-cell">
                    <input
                      type="text"
                      value={renamedHeaders[header] || header}
                      onChange={(e) =>
                        setRenamedHeaders((prevRenamedHeaders) => ({
                          ...prevRenamedHeaders,
                          [header]: e.target.value,
                        }))
                      }
                      maxLength={100}
                      style={{ width: "98%" }}
                    />
                  </td>
                  <td>
                    <label>
                      Group By:
                      <input
                        type="checkbox"
                        checked={groupByColumns[header]}
                        onChange={(e) => handleGroupByToggle(e, header)}
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Filter Section */}
      <div className="section filter-section">
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
                          onChange={(e) => {
                            setSearchTerms((prevSearchTerms) => ({
                              ...prevSearchTerms,
                              [header]: e.target.value,
                            }));
                          }}
                          maxLength={100}
                          style={{ width: "98%" }}
                        />
                      </td>
                      <td>
                        <select
                          value={filterCriteria[header] || ""}
                          onChange={(e) => {
                            setFilterCriteria((prevFilterCriteria) => ({
                              ...prevFilterCriteria,
                              [header]: e.target.value,
                            }));
                          }}
                        >
                          <option value="">All</option>
                          {dropdownOptions[header]?.map((option) => (
                            <option key={option} value={option}>
                              {typeof option === 'string' && option.length > 100 ? option.substring(0, 100) + "..." : option}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Table Section */}
      <div className="section table-section">
        <DataTable
          title="CSV|JSON Data"
          columns={columns}
          data={groupAndSortTableData(data)}
          pagination
          highlightOnHover
          pointerOnHover
          onRowClicked={handleRowClick}
        />
      </div>

      {/* Section 6: Reset and Download Section */}
      <div className="section reset-download-section">
        <button onClick={handleReset}>Reset</button>
        <button onClick={() => promptFileName("csv")}>Download as CSV</button>
        <button onClick={() => promptFileName("json")}>Download as JSON</button>
      </div>

      {/* Modal for Row Popup */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <RowPopup data={selectedRowData} onClose={() => setIsModalOpen(false)} />
      </Modal>

      {/* Modal for File Name Input */}
      <Modal isOpen={isFileNameModalOpen} onRequestClose={() => setIsFileNameModalOpen(false)}>
        <div>
          <h2>Enter File Name</h2>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name without extension"
          />
          <button onClick={handleFileNameSubmit}>Submit</button>
        </div>
      </Modal>
    </div>
  );
};

export default App;

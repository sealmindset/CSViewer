import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import DataTable from "react-data-table-component";
import { useDropzone } from "react-dropzone";
import Modal from "react-modal";
import RowPopup from "./RowPopup";
import "./App.css";

Modal.setAppElement("#root");

const App = () => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [renamedHeaders, setRenamedHeaders] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState([]); // Initialize hiddenColumns as an empty array
  const [filterCriteria, setFilterCriteria] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [initialState, setInitialState] = useState({});
  const [groupByColumns, setGroupByColumns] = useState({});
  const [selectedRowData, setSelectedRowData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupedData, setGroupedData] = useState([]);

  useEffect(() => {
    // Update filter criteria with renamed headers and handle hiddenColumns as an array
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

  useEffect(() => {
    setInitialState({
      renamedHeaders: { ...renamedHeaders },
      hiddenColumns: [...hiddenColumns], // Clone hiddenColumns as an array
      filterCriteria: { ...filterCriteria },
      searchTerms: { ...searchTerms },
    });
  }, [renamedHeaders, hiddenColumns, filterCriteria, searchTerms]);

  useEffect(() => {
    const filteredData = data.filter((row) =>
      headers.every((header) => {
        const criteria = filterCriteria[header];
        const searchTerm = searchTerms[header];
        return (
          (!criteria || criteria === "All" || row[header] === criteria) &&
          (!searchTerm || row[header].toLowerCase().includes(searchTerm.toLowerCase()))
        );
      })
    );

    // Apply group by and sort logic
    const groupedAndSortedData = groupAndSortTableData(filteredData);
    setGroupedData(groupedAndSortedData);
  }, [data, headers, filterCriteria, searchTerms]);

  const handleDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
  
    reader.onload = (event) => {
      const fileContent = event.target.result;
      if (file.name.endsWith(".csv")) {
        // Handle CSV data using Papa.parse as before
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            setData(result.data);
            setHeaders(result.meta.fields);
            setRenamedHeaders({});
            setHiddenColumns([]);
            setFilterCriteria({});
            setSearchTerms({});
            setDropdownOptions({});
            setGroupByColumns({});
          },
        });
      } else if (file.name.endsWith(".json")) {
        // Handle JSON data directly
        const jsonData = JSON.parse(fileContent);
        setData(jsonData);
        setHeaders(Object.keys(jsonData[0]));
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
      const value = row[header];
      if (value && value.length > 100) {
        return value.substring(0, 100) + "...";
      }
      return value;
    },
    omit: header === groupByColumn || hiddenColumns.includes(header), // Check if header is in hiddenColumns array
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

  const groupAndSortTableData = (tableData) => {
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
        const [sortBy, _] = sortByColumn;
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (!hiddenColumns.includes(sortBy)) {
          return aValue.localeCompare(bValue);
        }
      }
      return 0;
    });
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
              {headers.map((header) => (
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
                      style={{ width: "98%" }} // Set the input width to 100%
                    />
                  </td>
                  <td>
                    {/* Add "Group By" text next to the checkmark */}
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
                            const value = e.target.value;
                            const newColumn = renamedHeaders[header] || header;
                            setFilterCriteria((prevCriteria) => ({
                              ...prevCriteria,
                              [newColumn]: value,
                            }));
                            setSearchTerms((prevSearchTerms) => ({
                              ...prevSearchTerms,
                              [header]: value.slice(-100), // Take the latter part of the value
                            }));
                          }}
                          list={`datalist-${header}`}
                          maxLength={98}
                          size={95} // Set the input size to 100
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
        </div>
        <button onClick={handleReset}>Reset</button>
      </div>

      {/* Section 5: Table */}
      <div className="section section5">
        {/* ... (content for table section) */}
        <div className="table-container">
          <DataTable
            columns={columns}
            data={groupedData} // Replace 'filteredData' with 'groupedData'
            pagination
            paginationPerPage={10}
            onRowClicked={handleRowClick}
            noHeader
            customStyles={{
              headCells: {
                style: {
                  paddingLeft: "8px",
                  paddingRight: "8px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  fontWeight: "bold",
                  textAlign: "left",
                },
              },
              cells: {
                style: {
                  paddingLeft: "8px",
                  paddingRight: "8px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  textAlign: "left",
                },
              },
            }}
          />
        </div>
      </div>

      {/* Section 6: Download Buttons for CSV and JSON */}
      <div className="section section6">
        <div className="download-buttons">
          <button onClick={() => promptFileName("csv")}>Download CSV</button>
          <button onClick={() => promptFileName("json")}>Download JSON</button>
        </div>
      </div>

      {/* Modal for FileName */}
      <Modal
        isOpen={isFileNameModalOpen}
        onRequestClose={() => setIsFileNameModalOpen(false)}
        contentLabel="Enter Filename"
        className="filename-modal"
        overlayClassName="filename-modal-overlay"
      >
        <div className="filename-modal-content">
          <h2>Enter Filename</h2>
          <div className="filename-input-container">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={`Enter filename`}
            />
            <span className="file-extension">{`.${selectedFileFormat}`}</span>
          </div>
          <button onClick={handleFileNameSubmit}>Submit</button>
        </div>
      </Modal>

    </div>
  );
};

export default App;
import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import DataTable from "react-data-table-component";
import { useDropzone } from "react-dropzone";
import Modal from "react-modal";
import RowPopup from "./RowPopup";
import { flattenJSON } from "./utils";
import "./App.css";

Modal.setAppElement("#root");

const App = () => {
  // State declarations
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [renamedHeaders, setRenamedHeaders] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [groupedData, setGroupedData] = useState([]);
  const [selectedRowData, setSelectedRowData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileFormat, setSelectedFileFormat] = useState("");
  const [fileName, setFileName] = useState("");
  const [isFileNameModalOpen, setIsFileNameModalOpen] = useState(false);
  const [groupByColumns, setGroupByColumns] = useState({});

  // Define dropdownOptions (replace this with your actual options)
  const dropdownOptions = {};

  // Process uploaded CSV data
  useEffect(() => {
    if (data.length > 0) {
      const flattenedData = data.map((row) => {
        if (row["PROPERTIES"]) {
          const properties = JSON.parse(row["PROPERTIES"]);
          delete row["PROPERTIES"];
          return { ...row, ...flattenJSON(properties) };
        }
        return row;
      });

      setData(flattenedData);
    }
  }, [data]);

  // Perform filtering based on filterCriteria and searchTerms
  const filteredData = useCallback(() => {
    return data.filter((row) =>
      headers.every((header) => {
        const criteria = filterCriteria[header];
        const searchTerm = searchTerms[header];
        return (
          (!criteria || criteria === "All" || row[header] === criteria) &&
          (!searchTerm || row[header].toLowerCase().includes(searchTerm.toLowerCase()))
        );
      })
    );
  }, [data, headers, filterCriteria, searchTerms]);

  useEffect(() => {
    setGroupedData(groupAndSortTableData(filteredData(), headers));
  }, [headers, filteredData]);

  // Group and sort table data based on groupByColumns
  const groupAndSortTableData = useCallback((tableData, columns) => {
    if (!tableData || Object.keys(groupByColumns).length === 0) {
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

    return Object.values(groups)
      .flat()
      .sort((a, b) => {
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
  }, [groupByColumns, hiddenColumns]);

  // Handle file drop
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
            setData(result.data);
            setHeaders(Object.keys(result.data[0]));
          },
        });
      } else if (file.name.endsWith(".json")) {
        const jsonData = JSON.parse(fileContent);
        setData(jsonData);
        setHeaders(Object.keys(jsonData[0]));
      } else {
        alert("Unsupported file format. Please upload either CSV or JSON file.");
      }
    };

    reader.readAsText(file);
  }, []);

  // Handle column toggle
  const handleColumnToggle = (event, column) => {
    const isChecked = event.target.checked;
    setHiddenColumns((prevHiddenColumns) =>
      isChecked
        ? prevHiddenColumns.filter((hiddenColumn) => hiddenColumn !== column)
        : [...prevHiddenColumns, column]
    );
  };

  // Handle group by toggle
  const handleGroupByToggle = (event, column) => {
    const isChecked = event.target.checked;
    setGroupByColumns((prevGroupByColumns) => ({
      ...prevGroupByColumns,
      [column]: isChecked,
    }));
  };

  // Reset filters and group by selections
  const handleReset = () => {
    setRenamedHeaders({});
    setHiddenColumns([]);
    setFilterCriteria({});
    setSearchTerms({});
    setGroupByColumns({});
  };

  // Handle row click
  const handleRowClick = (row) => {
    setSelectedRowData(row);
    setIsModalOpen(true);
  };

  // Handle file name submission for download
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

  // Handle CSV or JSON download
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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
  });

  // Define the table columns
  const groupByColumn = "groupby";
  const updatedHeaders = [...headers.slice(0, 1), groupByColumn, ...headers.slice(1)];
  const columns = updatedHeaders.map((header) => {
    const isPropertiesHeader = header.startsWith("PROPERTIES_");
    const newColumn = renamedHeaders[header] || header;
    return {
      name: isPropertiesHeader ? newColumn.substring("PROPERTIES_".length) : newColumn,
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
      omit: header === groupByColumn || hiddenColumns.includes(header),
      grow: 1,
    };
  });

  return (
    <div className="App">
      {/* Section 1: Header or Title - CSV Table Display */}
      <div className="section section1">
        <h1>CSV | JSON Viewer</h1>
      </div>

      {/* Section 2: CSV File Input */}
      <div className="section section2">
        <div className="upload-container">
          <h2>Upload CSV | JSON Formatted File</h2>
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
                      style={{ width: "100%" }} // Set the input width to 100%
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
                          placeholder={`Filter ${renamedHeaders[header] || header}`}
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
                              [header]: value,
                            }));
                          }}
                          list={`datalist-${header}`}
                          maxLength={100}
                          size={95} // Set the input size to 95 instead of 100
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
            data={filteredData()} // Call the filteredData function to get the filtered data
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

      {/* Modal for displaying the RowPopup */}
      <Modal
        isOpen={isModalOpen} // Conditionally show/hide the modal based on isModalOpen state
        onRequestClose={() => setIsModalOpen(false)} // Close the modal when requested
        contentLabel="Row Popup"
        className="row-popup-modal"
        overlayClassName="row-popup-modal-overlay"
      >
        {isModalOpen && (
          <RowPopup
            headers={headers}
            rowData={selectedRowData}
            renamedHeaders={renamedHeaders}
            hiddenColumns={hiddenColumns}
            onClose={() => setIsModalOpen(false)} // Close the modal when the Close button is clicked
          />
        )}
      </Modal>

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

import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import DataTable from "react-data-table-component";
import { useDropzone } from "react-dropzone";
import Modal from "react-modal";
import RowPopup from "./RowPopup";
import { flattenProperties } from './JSONFlatten';

// For Material-UI components
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ReplayIcon from '@mui/icons-material/Replay';
import GetAppIcon from '@mui/icons-material/GetApp';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';

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
  const [isLoading, setIsLoading] = useState(false);

  const [ignoredKeys, setIgnoredKeys] = useState([]);
  const [columnsToUncheck, setColumnsToUncheck] = useState([]);

  const [isConfigFileNameModalOpen, setIsConfigFileNameModalOpen] = useState(false);
  const [configFileName, setConfigFileName] = useState("");

  const [expandedIgnore, setExpandedIgnore] = useState(false);
  const [expanded, setExpanded] = useState(false);


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
    setIsLoading(true);  // Set loading to true
    const file = acceptedFiles[0];
    const reader = new FileReader();

    const hasIgnoredKeys = ignoredKeys && ignoredKeys.length > 0;
    
    reader.onload = (event) => {
      const fileContent = event.target.result;
  
      if (file.name.endsWith(".csv")) {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const originalHeaders = Object.keys(result.data[0]);
  
            const processedData = result.data.map(row => {
              let newRow = { ...row };
  
              // Process PROPERTIES column
              if (row.PROPERTIES) {
                const flattenedProperties = flattenProperties(row.PROPERTIES);
                const filteredProperties = Object.fromEntries(
                  hasIgnoredKeys ?
                    Object.entries(flattenedProperties).filter(
                      ([key]) => !ignoredKeys.some(ignoredKey => key.startsWith(ignoredKey))
                    )
                  : Object.entries(flattenedProperties)
                );
                newRow = { ...newRow, ...filteredProperties };
              }
  
              // Process TAGS column
              if (row.TAGS) {
                const flattenedTags = flattenProperties(row.TAGS);
                newRow = { ...newRow, ...flattenedTags };
              }
  
              return newRow;
            });
  
            // Logic to find the longest JSON string for both PROPERTIES and TAGS
            let maxPropertyKeys = 0;
            let maxTagKeys = 0;
            let modelPropertyRow = null;
            let modelTagRow = null;
  
            processedData.forEach(row => {
              if (row.PROPERTIES) {
                const flattenedProperties = flattenProperties(row.PROPERTIES);
                const keysCount = Object.keys(flattenedProperties).length;
                const firstKey = Object.keys(flattenedProperties)[0];
            
                if (keysCount > maxPropertyKeys && !ignoredKeys.some(ignoredKey => firstKey.startsWith(ignoredKey))) {
                  maxPropertyKeys = keysCount;
                  modelPropertyRow = flattenedProperties;
                }
              }
  
              if (row.TAGS) {
                const flattenedTags = flattenProperties(row.TAGS);
                const keysCount = Object.keys(flattenedTags).length;
                if (keysCount > maxTagKeys) {
                  maxTagKeys = keysCount;
                  modelTagRow = flattenedTags;
                }
              }
            });
  
            let newHeaders = [...originalHeaders];
            if (modelPropertyRow) {
              newHeaders = [...newHeaders, ...Object.keys(modelPropertyRow)];
            }
            if (modelTagRow) {
              newHeaders = [...newHeaders, ...Object.keys(modelTagRow)];
            }

            // Identify columns with all null or empty values
            const emptyColumns = newHeaders.reduce((acc, header) => {
              const allEmpty = processedData.every(row => 
                row[header] == null || 
                (typeof row[header] === 'string' && row[header].trim() === '') ||
                (Array.isArray(row[header]) && row[header].length === 0)
              );
              if (allEmpty) {
                acc.push(header);
              }
              return acc;
            }, []);

  
            setHeaders(newHeaders);
            setData(processedData);
            setRenamedHeaders({});
            setHiddenColumns([...new Set([...emptyColumns, ...columnsToUncheck])]);
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
      setIsLoading(false);  // Set loading to false
    };

    reader.readAsText(file);
   
  }, [ignoredKeys, columnsToUncheck]);

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
    const visibleData = groupAndSortTableData(data).map((row) =>
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

  const filteredData = useCallback(() => {
    return data.filter(row => {
      for (const header of headers) {
        // Check if there's a search term for this header and if the row doesn't match the search term
        if (searchTerms[header] && !String(row[header]).toLowerCase().includes(searchTerms[header].toLowerCase())) {
          return false;
        }
        // Check if there's a filter criteria for this header and if the row doesn't match the filter criteria
        if (filterCriteria[header] && row[header] !== filterCriteria[header]) {
          return false;
        }
      }
      return true;
    });
  }, [data, headers, searchTerms, filterCriteria]);

  const handleSave = (editedRowData) => {
    const updatedData = data.map((row) => {
      if (row.id === editedRowData.id) {  // Assuming each row has a unique 'id' field
        return editedRowData;
      }
      return row;
    });
    setData(updatedData);
  };

  const handleConfigUpload = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
  
    reader.onload = (event) => {
      const fileContent = event.target.result;
  
      try {
        const config = JSON.parse(fileContent);
  
        if (config.ignoredKeys && Array.isArray(config.ignoredKeys)) {
          setIgnoredKeys(config.ignoredKeys);
        }
        if (config.columnsToUncheck && Array.isArray(config.columnsToUncheck)) {
          setColumnsToUncheck(config.columnsToUncheck);
        }
  
      } catch (error) {
        alert("Invalid configuration file. Please upload a valid JSON file.");
      }
    };
  
    reader.readAsText(file);
  }, []);
  

  const { getRootProps: getConfigRootProps, getInputProps: getConfigInputProps } = useDropzone({
    onDrop: handleConfigUpload,
    accept: ".json", // Only allow JSON files for configuration
    multiple: false,
  });

  // Function to handle checkbox toggle for ignoredKeys
  const toggleIgnoredKey = (key) => {
    // Your logic to toggle ignored key
  };

  // Function to handle checkbox toggle for columnsToUncheck
  const toggleColumnToUncheck = (column) => {
    // Your logic to toggle column to uncheck
  };

  const updateIgnoredKey = (index, newValue) => {
    const newIgnoredKeys = [...ignoredKeys];
    newIgnoredKeys[index] = newValue;
    setIgnoredKeys(newIgnoredKeys);
  };
  
  const updateColumnToUncheck = (index, newValue) => {
    const newColumnsToUncheck = [...columnsToUncheck];
    newColumnsToUncheck[index] = newValue;
    setColumnsToUncheck(newColumnsToUncheck);
  };
  
  const addNewIgnoredKey = () => {
    setIgnoredKeys([...ignoredKeys, ""]);
  };

  const removeIgnoredKey = (index) => {
    const newIgnoredKeys = [...ignoredKeys];
    newIgnoredKeys.splice(index, 1);
    setIgnoredKeys(newIgnoredKeys);
  };

  const addNewColumnToUncheck = () => {
    setColumnsToUncheck([...columnsToUncheck, ""]);
  };

  const removeColumnToUncheck = (index) => {
    const newColumnsToUncheck = [...columnsToUncheck];
    newColumnsToUncheck.splice(index, 1);
    setColumnsToUncheck(newColumnsToUncheck);
  };

  const saveConfigToFile = () => {
    const config = {
      ignoredKeys,
      columnsToUncheck
    };
  
    const dataToExport = JSON.stringify(config, null, 2);
    const blob = new Blob([dataToExport], { type: 'text/json;charset=utf-8;' });
    const link = document.createElement('a');
  
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${configFileName}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  
    // Close the filename modal and reset the filename
    setIsConfigFileNameModalOpen(false);
    setConfigFileName("");
  };
  
  
  const promptConfigFileName = () => {
    setIsConfigFileNameModalOpen(true);
  };

  const handleConfigFileNameSubmit = () => {
    setIsConfigFileNameModalOpen(false);
    if (configFileName.trim() !== "") {
      saveConfigToFile();
    }
  };

  const handleExpandClickignore = () => {
    setExpandedIgnore(!expandedIgnore);
  };
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="App" style={{ backgroundColor: 'lightgray' }}>

      {/* Section 1: Header or Title - CVS Table Display */}
      <div className="header">
        <Card className="card">
        <CardHeader 
          title="CSV | JSON File Examiner" 
          titleTypographyProps={{ align: 'center', variant: 'h4' }}
        />
        </Card>
      </div>

      {/* Section 1.5: Exceptype Upload */}
      <div className="ignorecol">
        <Card>
          <CardHeader
            title="Ignore Configuration File"
            action={
              <IconButton
                onClick={handleExpandClickignore}
                aria-expanded={expandedIgnore}
                aria-label="show more"
              >
                <ExpandMoreIcon />
              </IconButton>
            }
          />
          <Collapse in={expandedIgnore} timeout="auto" unmountOnExit>

            <div className="exceptup">
              <Card className="card">
                <CardContent>
                  <div {...getConfigRootProps()} className="dropzone">
                    <input {...getConfigInputProps()} />
                    <i className="upload-icon">📤</i>
                    <p>Drag 'n' drop a Config JSON file here, or click to select a file</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          
            {/* Section 1.6: Exceptype Tables */}
            <div className="exceptype">
              <Card className="card">
              <CardHeader title="Ignore by Field Value" />
                <CardContent>
                  {/* Table for ignoredKeys */}
                  <table style={{ width: '100%', marginTop: '20px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '1%' }}> </th>
                        <th>Field Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ignoredKeys.map((key, index) => (
                        <tr key={index}>
                          <td><input type="checkbox" onChange={() => toggleIgnoredKey(key)} /></td>
                          <td><input type="text" value={key} onChange={(e) => updateIgnoredKey(index, e.target.value)} /></td>
                          <Button variant="contained" color="secondary" startIcon={<DeleteIcon />} onClick={removeIgnoredKey}>
                            Remove
                          </Button>
                        </tr>
                      ))}
                      <tr>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={addNewIgnoredKey}>
                            Add Row
                        </Button>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Table for columnsToUncheck */}
            <div className="columnsToUncheck">
              <Card className="card">
              <CardHeader title="Ignore Content" />
                <CardContent>
                  <table style={{ width: '100%', marginTop: '20px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '1%' }}> </th>
                        <th>Column Header</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columnsToUncheck.map((column, index) => (
                        <tr key={index}>
                          <td><input type="checkbox" onChange={() => toggleColumnToUncheck(column)} /></td>
                          <td><input type="text" value={column} onChange={(e) => updateColumnToUncheck(index, e.target.value)} /></td>
                          <td><Button variant="contained" color="secondary" startIcon={<DeleteIcon />} onClick={() => removeColumnToUncheck(index)}>Remove</Button></td>
                        </tr>
                      ))}
                      <tr>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={addNewColumnToUncheck}>
                            Add Row
                        </Button>
                      </tr>
                    </tbody>
                  </table>
                  <div>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={promptConfigFileName}>
                        Save Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Collapse>
        </Card>
      </div>

      {/* Section 2: CVS File Input */}
      <div className="upload">
        <Card className="card">
          <CardHeader title="Upload to be Examined" />
          <CardContent>
            <div className="upload-container">
              <div {...getRootProps()} className="dropzone">
                <input {...getInputProps()} />
                <i className="upload-icon">📤</i>
                <p>Drag 'n' drop a CSV or JSON file here, or click to select a file</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && <div className="spinner"></div>}

      <div className="filtertoggle">
        <Card>
        <CardHeader
          title="Filter and Toggle"
          action={
            <IconButton
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
            >
              <ExpandMoreIcon />
            </IconButton>
          }
        />
        <Collapse in={expanded} timeout="auto" unmountOnExit>
            {/* Section 3: Toggle Section */}
            <div className="toggle">
              <Card className="card">
              <CardHeader title="Toggle" />
                <CardContent> 
                  <div className="toggle-table-container">
                    <table className="toggle-columns-table">
                      {/* Toggle Section */}
                      <tbody>
                        {Array.isArray(headers) && headers.map((header) => {
                          const truncatedHeaderValue = (renamedHeaders[header] || header).substring(0, 100);
                          return (
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
                                  className="rename-input"
                                  value={truncatedHeaderValue}
                                  onChange={(e) =>
                                    setRenamedHeaders((prevRenamedHeaders) => ({
                                      ...prevRenamedHeaders,
                                      [header]: e.target.value,
                                    }))
                                  }
                                  maxLength={100}
                                />
                              </td>
                              <td className="group-by-label">
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 4: Filter Section */}
            <div className="filter">
              <Card className="card">
              <CardHeader title="Filter" />
                <CardContent> 
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
                                    {dropdownOptions[header]?.map((option) => {
                                        if (!option) return null;  // Add this line to handle undefined or null options
                                        const truncatedOption = option.length > 100 ? option.substring(0, 100) + "..." : option;
                                        return (
                                            <option key={option} value={option}>
                                                {truncatedOption}
                                            </option>
                                        );
                                    })}

                                  </select>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Collapse>
        </Card>
      </div>
      
      {/* Section 5: Table Section */}
      <div className="table-section">
        <Card className="card">
        <CardHeader title="Results" />
          <CardContent> 
              <DataTable
                columns={columns}
                data={groupAndSortTableData(filteredData())}
                pagination
                highlightOnHover
                pointerOnHover
                onRowClicked={handleRowClick}
              />
            </CardContent>
        </Card>
      </div>

      {/* Section 6: Reset and Download Section */}
      <div className="download">
        <Card className="card">
        <CardHeader title="Save Results" />
          <CardContent>
            <Button
            variant="contained"
            color="secondary"
            startIcon={<ReplayIcon />}
            onClick={handleReset}>
              Reset
            </Button>
            <Button
            variant="contained"
            color="primary"
            startIcon={<GetAppIcon />}
            onClick={() => promptFileName("csv")}>
              Download CSV
            </Button>
            <Button
            variant="contained"
            color="primary"
            startIcon={<GetAppIcon />}
            onClick={() => promptFileName("json")}>
              Download JSON
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Section 7: Modal Section */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <RowPopup 
          data={selectedRowData} 
          headers={headers}
          renamedHeaders={renamedHeaders}
          hiddenColumns={hiddenColumns}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}  // Pass the handleSave function here
        />
      </Modal>

      {/* Section 8: File Name Modal */}
      <Modal isOpen={isFileNameModalOpen} onRequestClose={() => setIsFileNameModalOpen(false)}>
        <div className="file-name-modal">
          <h2>Enter File Name</h2>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name without extension"
          />
          <div className="file-name-modal-buttons">
            <button onClick={handleFileNameSubmit}>Submit</button>
            <button onClick={() => setIsFileNameModalOpen(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Config File Name Modal */}
      <Modal isOpen={isConfigFileNameModalOpen} onRequestClose={() => setIsConfigFileNameModalOpen(false)}>
        <div className="file-name-modal">
          <h2>Enter Config File Name</h2>
          <input
            type="text"
            value={configFileName}
            onChange={(e) => setConfigFileName(e.target.value)}
            placeholder="Enter file name without extension"
          />
          <div className="file-name-modal-buttons">
            <button onClick={handleConfigFileNameSubmit}>Submit</button>
            <button onClick={() => setIsConfigFileNameModalOpen(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
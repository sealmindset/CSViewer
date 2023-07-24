import React, { useState, useMemo, useEffect, useCallback } from "react";
import Papa from "papaparse";
import Modal from "react-modal";
import RowPopup from "./RowPopup";
import DataTable from "react-data-table-component";
import "./App.css";

const App = () => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [renamedHeaders, setRenamedHeaders] = useState({});
  const [selectedRowData, setSelectedRowData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [initialState, setInitialState] = useState({});

  useEffect(() => {
    // Refresh filter criteria when renamedHeaders change
    setFilterCriteria((prevCriteria) => {
      const updatedCriteria = {};
      Object.entries(prevCriteria).forEach(([column, value]) => {
        const newColumn = renamedHeaders[column] || column;
        updatedCriteria[newColumn] = value;
      });
      return updatedCriteria;
    });
  }, [renamedHeaders]);

  useEffect(() => {
    // Update dropdown options when searchTerms change
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
    // Save the initial state for reset
    setInitialState({
      renamedHeaders: { ...renamedHeaders },
      hiddenColumns: [...hiddenColumns],
      filterCriteria: { ...filterCriteria },
      searchTerms: { ...searchTerms },
    });
  }, [renamedHeaders, hiddenColumns, filterCriteria, searchTerms]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
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
      },
    });
  };

  const handleRowClick = (rowData) => {
    setSelectedRowData(rowData);
    setIsModalOpen(true);
  };

  const columns = headers.map((header) => ({
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
    omit: hiddenColumns.includes(header),
    grow: 1,
  }));

  const filteredData = useMemo(() => {
    if (Object.keys(filterCriteria).length === 0 && Object.keys(searchTerms).length === 0)
      return data;
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

  const handleColumnToggle = (event, column) => {
    const isChecked = event.target.checked;
    setHiddenColumns((prevHidden) => {
      if (isChecked) {
        return prevHidden.filter((col) => col !== column);
      } else {
        return [...prevHidden, column];
      }
    });
    // Update the renamedHeaders state with the edited field name
    setRenamedHeaders((prevRenamedHeaders) => {
      const updatedHeaders = { ...prevRenamedHeaders };
      if (!isChecked) {
        // Reset field name to default when column is hidden
        delete updatedHeaders[column];
      }
      return updatedHeaders;
    });
  };

  const handleFilterChange = useCallback((event, column) => {
    const value = event.target.value;
    const newColumn = renamedHeaders[column] || column;
    setFilterCriteria((prevCriteria) => {
      const updatedCriteria = { ...prevCriteria, [newColumn]: value };
      if (dropdownOptions[column] && !dropdownOptions[column].includes(value)) {
        const closestMatch = dropdownOptions[column].find(
          (option) => option.toLowerCase().startsWith(value.toLowerCase())
        );
        if (closestMatch) {
          updatedCriteria[newColumn] = closestMatch;
        }
      }
      return updatedCriteria;
    });
    setSearchTerms((prevSearchTerms) => ({
      ...prevSearchTerms,
      [column]: value,
    }));
  }, [renamedHeaders, dropdownOptions]);

  const handleReset = () => {
    setRenamedHeaders(initialState.renamedHeaders);
    setHiddenColumns(initialState.hiddenColumns);
    setFilterCriteria(initialState.filterCriteria);
    setSearchTerms(initialState.searchTerms);
  };

  const handleDownloadCSV = () => {
    const visibleData = filteredData.map((row) =>
      headers.reduce((acc, header) => {
        if (!hiddenColumns.includes(header)) {
          const newColumn = renamedHeaders[header] || header;
          acc[newColumn] = row[header];
        }
        return acc;
      }, {})
    );
    const csv = Papa.unparse(visibleData, { header: true });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "filtered_data.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadJSON = () => {
    const visibleData = filteredData.map((row) =>
      headers.reduce((acc, header) => {
        if (!hiddenColumns.includes(header)) {
          const newColumn = renamedHeaders[header] || header;
          acc[newColumn] = row[header];
        }
        return acc;
      }, {})
    );
    const json = JSON.stringify(visibleData, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "filtered_data.json");
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
        <h1>CVS Table Display</h1>
      </div>

      {/* Section 2: CVS File Input */}
      <div className="section section2">
        <div className="upload-container">
          <h2>Upload CSV</h2>
          <input type="file" accept=".csv" onChange={handleFileUpload} />
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
        <div className="table-container">
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            paginationPerPage={10}
            onRowClicked={handleRowClick}
            noHeader={false}
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
          <button onClick={handleDownloadCSV}>Download CSV</button>
          <button onClick={handleDownloadJSON}>Download JSON</button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Selected Row Data"
      >
        <RowPopup
          headers={headers}
          rowData={selectedRowData}
          renamedHeaders={renamedHeaders}
          hiddenColumns={hiddenColumns} // Pass the hiddenColumns state as a prop
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>

    </div>
  );
};

export default App;
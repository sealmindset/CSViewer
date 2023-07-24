// App.js
import React, { useState, useMemo, useEffect, useCallback } from "react";
import Papa from "papaparse";
import Modal from "react-modal";
import DataTable from "react-data-table-component";
import "./App.css";
import CSVUploader from "./CSVUploader";
import ColumnToggle from "./ColumnToggle";
import FilterSection from "./FilterSection";
import RowPopup from "./RowPopup";

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

  const handleFileUpload = (file) => {
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

  const columns = useMemo(
    () =>
      headers.map((header) => ({
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
      })),
    [headers, renamedHeaders, hiddenColumns]
  );

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

  const handleColumnToggle = useCallback(
    (column) => {
      setHiddenColumns((prevHidden) =>
        prevHidden.includes(column) ? prevHidden.filter((col) => col !== column) : [...prevHidden, column]
      );
      // Update the renamedHeaders state with the edited field name
      setRenamedHeaders((prevRenamedHeaders) => {
        const updatedHeaders = { ...prevRenamedHeaders };
        if (hiddenColumns.includes(column)) {
          // Reset field name to default when column is shown again
          delete updatedHeaders[column];
        }
        return updatedHeaders;
      });
    },
    [hiddenColumns]
  );

  const handleFilterChange = useCallback(
    (column, value) => {
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
        [column]: value.slice(-100), // Take the latter part of the value
      }));
    },
    [renamedHeaders, dropdownOptions]
  );

  const handleReset = () => {
    setRenamedHeaders(initialState.renamedHeaders);
    setHiddenColumns(initialState.hiddenColumns);
    setFilterCriteria(initialState.filterCriteria);
    setSearchTerms(initialState.searchTerms);
  };

  const handleDownload = (format) => {
    const visibleData = filteredData.map((row) =>
      headers.reduce((acc, header) => {
        if (!hiddenColumns.includes(header)) {
          const newColumn = renamedHeaders[header] || header;
          acc[newColumn] = row[header];
        }
        return acc;
      }, {})
    );

    let outputData, filename;
    if (format === "csv") {
      outputData = Papa.unparse(visibleData, { header: true });
      filename = "filtered_data.csv";
    } else if (format === "json") {
      outputData = JSON.stringify(visibleData, null, 2);
      filename = "filtered_data.json";
    }

    const blob = new Blob([outputData], { type: format === "csv" ? "text/csv;charset=utf-8;" : "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
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
        <h1>CSV Table Display</h1>
      </div>

      {/* Section 2: CVS File Input */}
      <div className="section section2">
        <CSVUploader onFileUpload={handleFileUpload} />
      </div>

      {/* Section 3: Toggle Section */}
      <div className="section section3-and-4">
        <div className="section3-and-4-container">
          <div className="toggle-section">
            <ColumnToggle
              headers={headers}
              renamedHeaders={renamedHeaders}
              hiddenColumns={hiddenColumns}
              onColumnToggle={handleColumnToggle}
            />
          </div>
          <div className="filter-section">
            <FilterSection
              headers={headers}
              renamedHeaders={renamedHeaders}
              hiddenColumns={hiddenColumns}
              filterCriteria={filterCriteria}
              searchTerms={searchTerms}
              dropdownOptions={dropdownOptions}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Table */}
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

      {/* Section 5: Download Buttons for CSV and JSON */}
      <div className="section section6">
        <div className="download-buttons">
          <button onClick={() => handleDownload("csv")}>Download CSV</button>
          <button onClick={() => handleDownload("json")}>Download JSON</button>
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


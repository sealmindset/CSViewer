// The script creates a dynamic CSV table display with filtering, 
// searching, column toggling, pagination, and the ability to view 
// detailed information for each row in a modal. Users can also 
// download the filtered data as CSV or JSON files.

import React, { useState, useMemo } from "react";
import Papa from "papaparse";
import Modal from "react-modal";
import RowPopup from "./RowPopup";
import DataTable from "react-data-table-component";
import "./App.css";

const App = () => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedRowData, setSelectedRowData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({});
  const [searchTerms, setSearchTerms] = useState({});

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setData(result.data);
        setHeaders(result.meta.fields);
        setHiddenColumns([]);
        setFilterCriteria({});
        setSearchTerms({});
      },
    });
  };

  const handleRowClick = (rowData) => {
    setSelectedRowData(rowData);
    setIsModalOpen(true);
  };

  const columns = headers.map((header) => ({
    name: header,
    selector: header,
    sortable: true,
    wrap: true,
    format: (row) => {
      if (row[header].length > 100) {
        return row[header].substring(0, 100) + "...";
      }
      return row[header];
    },
    omit: hiddenColumns.includes(header),
    grow: 1,
  }));

  const filteredData = useMemo(() => {
    if (Object.keys(filterCriteria).length === 0 && Object.keys(searchTerms).length === 0) return data;
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
    if (isChecked) {
      setHiddenColumns((prevHidden) => prevHidden.filter((col) => col !== column));
    } else {
      setHiddenColumns((prevHidden) => [...prevHidden, column]);
      setFilterCriteria((prevCriteria) => {
        const updatedCriteria = { ...prevCriteria };
        delete updatedCriteria[column];
        return updatedCriteria;
      });
    }
  };

  const handleFilterChange = (event, column) => {
    const value = event.target.value;
    setFilterCriteria((prevCriteria) => ({
      ...prevCriteria,
      [column]: value,
    }));
  };

  const handleSearchChange = (event, column) => {
    const value = event.target.value;
    setSearchTerms((prevSearchTerms) => ({
      ...prevSearchTerms,
      [column]: value,
    }));
  };

  const handleDownloadCSV = () => {
    const visibleData = filteredData.map((row) =>
      headers.reduce((acc, header) => {
        if (!hiddenColumns.includes(header)) {
          acc[header] = row[header];
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
          acc[header] = row[header];
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
      <h1>CSV Table Display</h1>
      <div className="upload-container">
        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>
      <div className="toggle-columns-container">
        <p>Toggle Columns:</p>
        {headers.map((header) => (
          <label key={header}>
            <input
              type="checkbox"
              checked={!hiddenColumns.includes(header)}
              onChange={(e) => handleColumnToggle(e, header)}
            />
            {header}
          </label>
        ))}
      </div>
      <div className="filter-container">
        {headers.map((header) => (
          <React.Fragment key={header}>
            {!hiddenColumns.includes(header) && (
              <div className="filter-row">
                <span>{header}: </span>
                <select value={filterCriteria[header] || "All"} onChange={(e) => handleFilterChange(e, header)}>
                  <option value="All">All</option>
                  {Array.from(new Set(data.map((row) => row[header]))).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={`Search ${header}`}
                  value={searchTerms[header] || ""}
                  onChange={(e) => handleSearchChange(e, header)}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
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

      <div className="download-buttons">
        <button onClick={handleDownloadCSV}>Download CSV</button>
        <button onClick={handleDownloadJSON}>Download JSON</button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Selected Row Data"
      >
        <RowPopup headers={headers} rowData={selectedRowData} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default App;


import React, { useState, useEffect, useCallback } from "react";
import DisplayTable from "../components/DisplayTable";
import HomeIcon from "@mui/icons-material/Home";
import { Link } from "react-router-dom";
import TuneIcon from "@mui/icons-material/Tune";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import DownloadIcon from "@mui/icons-material/Download";
import { Menu, MenuItem } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import { utils, writeFile } from "xlsx";
import SearchIcon from "@mui/icons-material/Search";
import API_URL from "../apis/api";

function Home() {
  const [data, setData] = useState([]);
  const [currentSource, setCurrentSource] = useState([]);
  const resultsPerPage = 50;
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageNumbers, setPageNumbers] = useState([]);
  const [queryString, setQueryString] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(1);
  useEffect(() => {
    console.log("Current Source Updated:", currentSource);
  }, [currentSource]);
  const menuStyles = {
    paper: {
      backgroundColor: "#99ceed",
      color: "white",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      borderRadius: "8px",
    },
    menuItem: {
      padding: "10px 20px",
      fontSize: "15px",
      fontWeight: "bold",
      "&:hover": {
        backgroundColor: "#6eb9e6",
      },
    },
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

  const handleClearSearch = () => {
    setQueryString("");
  };

  const fetchData = useCallback(async (page = 1) => {
    try {
      const response = await fetch(
        API_URL + `/healthshare/api/alldata?page=${page}`,
        {
          mode: "cors",
        }
      );
      const result = await response.json();

      setData(result.data);
      setTotalRecords(result.totalRecords);
      setCurrentPage(page);
      setPageInput(page);

      const totalPages = Math.ceil(result.totalRecords / resultsPerPage);
      const numberOfPages = 6;
      const startPage = Math.max(1, page - Math.floor(numberOfPages / 2));
      const endPage = Math.min(totalPages, startPage + numberOfPages - 1);

      const pages = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );
      setPageNumbers(pages);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuery = async (query, page = 1, sourceArray = currentSource) => {
    try {
      const sources = sourceArray.join(","); // Combine selected sources into a comma-separated string
      const response = await fetch(
        `${API_URL}/healthshare/api/querydata?query=${query}&source=${sources}&page=${page}`,
        { mode: "cors" }
      );
      const result = await response.json();
      console.log(response);
      setData(result.data);
      setTotalRecords(result.totalRecords); // Update total records for pagination
      setCurrentPage(page);
      setPageInput(page);

      // Calculate page numbers for pagination
      const totalPages = Math.ceil(result.totalRecords / resultsPerPage);
      const numberOfPages = 6;
      const startPage = Math.max(1, page - Math.floor(numberOfPages / 2));
      const endPage = Math.min(totalPages, startPage + numberOfPages - 1);
      const pages = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );
      setPageNumbers(pages);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };

  const handleSortBy = useCallback(async (sources, page = 1) => {
    try {
      const response = await fetch(
        API_URL +
          `/healthshare/api/sortbysource?source=${sources}&page=${page}`,
        {
          mode: "cors",
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Failed to fetch data");
      }
      const result = await response.json();
      setData(result.data);
      setTotalRecords(result.totalRecords);
      setCurrentPage(page);
      setPageInput(page);
      const totalPages = Math.ceil(result.totalRecords / resultsPerPage);
      const numberOfPages = 6;
      const startPage = Math.max(1, page - Math.floor(numberOfPages / 2));
      const endPage = Math.min(totalPages, startPage + numberOfPages - 1);
      const pages = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );
      setPageNumbers(pages);
      handleMenuClose();
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  }, []);

  const downloadData = (allData) => {
    const headings = [["Source", "Text", "Created at"]];
    const wb = utils.book_new();
    const ws = utils.json_to_sheet([]);
    const transformedData = allData.map((row) => ({
      data_source: row.data_source,
      text:
        row.data_source === "Medium" || row.data_source === "CNN"
          ? row.url
          : row.text,
      created_at: row.created_at,
    }));
    utils.sheet_add_aoa(ws, headings);
    utils.sheet_add_json(ws, transformedData, {
      origin: "A2",
      skipHeader: true,
    });
    utils.book_append_sheet(wb, ws, "Current Page");
    writeFile(wb, "Current_Page_Data.xlsx");
  };
  const handleExportCurrentPage = () => {
    if (data.length > 0) downloadData(data);
    handleExportMenuClose();
  };

  const handleExportAllResults = async () => {
    try {
      if (Number(totalRecords) > 1000) {
        alert("Cannot Export more than 1000 records");
        return;
      }
      const sources = currentSource.join(",");
      let response;
      if (queryString) {
        response = await fetch(
          `${API_URL}/healthshare/api/querydata/all?query=${queryString}&source=${sources}`,
          {
            mode: "cors",
          }
        );
      } else {
        response = await fetch(
          `${API_URL}/healthshare/api/allresults?source=${sources}`,
          {
            mode: "cors",
          }
        );
      }
      const result = await response.json();
      const allData = result.data;
      if (allData.length > 0) downloadData(allData);
      handleExportMenuClose();
    } catch (error) {
      console.error("There was a problem fetching all results:", error);
    }
  };

  return (
    <div className="m-3">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px",
          backgroundColor: "#6eb9e6",
          color: "white",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <HomeIcon
            style={{
              marginRight: "10px",
              fontSize: "2rem",
              cursor: "pointer",
              color: "white",
            }}
            onClick={() => {
              fetchData();
              setCurrentSource([]);
              handleClearSearch();
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            justifyContent: "right",
          }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="search"
              id="query"
              style={{
                padding: "10px 30px 10px 20px",
                borderRadius: "20px",
                border: "none",
                width: "100%",
                outline: "none",
                fontSize: "13px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                backgroundColor: queryString ? "#f7f7f7" : "white",
                transition: "background-color 0.1s",
              }}
              placeholder="enter keywords"
              aria-label="Search"
              value={queryString}
              onChange={(e) => setQueryString(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
            <button
              style={{
                marginLeft: "10px",
                padding: "10px",
                height: "100%",
                borderRadius: "6px",
                fontWeight: "bold",
                border: "none",
                backgroundColor: "inherit",
                color: "white",
                cursor: "pointer",
                fontSize: "15px",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#99ceed")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "inherit")}
              onClick={() => queryString && handleQuery(queryString, 1)}
            >
              Search
            </button>

          <TuneIcon
            style={{
              marginLeft: "10px",
              fontSize: "1.6rem",
              height: "100%",
              borderRadius: "6px",
              fontWeight: "bold",
              border: "none",
              backgroundColor: "inherit",
              color: "white",
              cursor: "pointer",
              transition: "background-color 0.3s",
            }}
            onClick={handleMenuOpen}
          ></TuneIcon>

          <DownloadIcon
            style={{
              marginLeft: "10px",
              fontSize: "1.8rem",
              cursor: "pointer",
              color: "white",
            }}
            onClick={handleExportMenuOpen}
          />
          <Menu
            anchorEl={exportMenuAnchorEl}
            open={Boolean(exportMenuAnchorEl)}
            onClose={handleExportMenuClose}
            PaperProps={{ sx: menuStyles.paper }}
          >
            <MenuItem
              sx={menuStyles.menuItem}
              onClick={handleExportCurrentPage}
            >
              Download Current Page
            </MenuItem>
            <MenuItem sx={menuStyles.menuItem} onClick={handleExportAllResults}>
              Download All Results
            </MenuItem>
          </Menu>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{ sx: menuStyles.paper }}
          >
            {["Twitter", "Facebook", "Medium", "CNN"].map((source) => (
              <MenuItem key={source} sx={menuStyles.menuItem}>
                <Checkbox
                  size="small"
                  sx={{
                    marginRight: "9px",
                    color: "white",
                    "&.Mui-checked": {
                      color: "white",
                    },
                  }}
                  checked={currentSource.includes(source)}
                  onChange={() => {
                    const isSourceSelected = currentSource.includes(source);

                    const updatedSources = isSourceSelected
                      ? currentSource.filter((s) => s !== source)
                      : [...currentSource, source];
                    setCurrentSource(updatedSources);
                    console.log(currentSource);

                    if (queryString) {
                      handleQuery(queryString, 1, updatedSources); // Handle search pagination
                    } else if (updatedSources.length === 0) {
                      fetchData();
                    } else {
                      handleSortBy(updatedSources.join(","), 1);
                    }
                  }}
                />
                {source}
              </MenuItem>
            ))}
          </Menu>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          marginBottom: "10px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            marginLeft: "10px",
            color: "#333",
          }}
        >
          Showing <b>{totalRecords}</b> results
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {" "}
          <button
            disabled={currentPage === 1}
            onClick={() => {
              if (queryString) {
                handleQuery(queryString, 1);
              } else if (currentSource.length === 0) {
                fetchData(1);
              } else {
                handleSortBy(currentSource.join(","), 1);
              }
            }}
            style={{
              borderRadius: "6px",
              border: "none",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <KeyboardDoubleArrowLeftIcon
              style={{ color: "#6eb9e6", fontSize: "2rem" }}
            />
          </button>
          <button
            disabled={currentPage === 1}
            onClick={() => {
              if (queryString) {
                handleQuery(queryString, currentPage - 1);
              } else if (currentSource.length === 0) {
                fetchData(currentPage - 1);
              } else {
                handleSortBy(currentSource.join(","), currentPage - 1);
              }
            }}
            style={{
              borderRadius: "6px",
              border: "none",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <KeyboardArrowLeft style={{ color: "#6eb9e6", fontSize: "2rem" }} />
          </button>
          <div style={{ fontSize: "16px", marginRight: "10px", color: "#333" }}>
            Page{"  "}
            <input
              type="text"
              value={pageInput}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setPageInput("");
                  return;
                }
                const page = Number(value);
                const totalPages = Math.ceil(totalRecords / resultsPerPage);
                if (page >= 1 && page <= totalPages && !isNaN(value)) {
                  if (queryString) {
                    handleQuery(queryString, page);
                  } else if (currentSource.length === 0) {
                    fetchData(page);
                  } else {
                    handleSortBy(currentSource.join(","), page);
                  }
                } else {
                  alert("Invalid input");
                }
              }}
              // onBlur={handlePageSubmit}
              min="1"
              max={Math.ceil(totalRecords / resultsPerPage)}
              style={{
                marginLeft: "5px",
                marginRight: "5px",
                width: "40px",
                textAlign: "center",
              }}
            />
            {"  "}
            of <b>{Math.ceil(totalRecords / resultsPerPage)}</b>
          </div>
          <button
            disabled={currentPage === Math.ceil(totalRecords / resultsPerPage)}
            onClick={() => {
              if (queryString) {
                handleQuery(queryString, currentPage + 1);
              } else if (currentSource.length === 0) {
                fetchData(currentPage + 1);
              } else {
                handleSortBy(currentSource.join(","), currentPage + 1);
              }
            }}
            style={{
              borderRadius: "6px",
              border: "none",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <KeyboardArrowRight
              style={{ color: "#6eb9e6", fontSize: "2rem" }}
            />
          </button>
          <button
            disabled={currentPage === Math.ceil(totalRecords / resultsPerPage)}
            onClick={() => {
              const lastPage = Math.ceil(totalRecords / resultsPerPage);
              if (queryString) {
                handleQuery(queryString, lastPage);
              } else if (currentSource.length === 0) {
                fetchData(lastPage);
              } else {
                handleSortBy(currentSource.join(","), lastPage);
              }
            }}
            style={{
              borderRadius: "6px",
              border: "none",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <KeyboardDoubleArrowRightIcon
              style={{ color: "#6eb9e6", fontSize: "2rem" }}
            />
          </button>
        </div>
      </div>
      <div style={{ paddingTop: "2px" }}>
        <DisplayTable
          data={data}
          startIndex={(currentPage - 1) * resultsPerPage + 1}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          {/* First Page Button */}
          <button
            disabled={currentPage === 1}
            onClick={() => {
              if (queryString) {
                handleQuery(queryString, 1); // Handle search pagination
              } else if (currentSource.length === 0) {
                fetchData(1); // Navigate to the first page
              } else {
                handleSortBy(currentSource.join(","), 1); // Navigate to the first page with sorting
              }
            }}
            style={{
              marginRight: "10px",
              border: "1px solid #58afe2",
              color: currentPage === 1 ? "#aaa" : "#58afe2",
              backgroundColor: currentPage === 1 ? "#f0f0f0" : "#fff",
              padding: "8px 12px",
              borderRadius: "11rem",
              cursor: currentPage === 1 ? "default" : "pointer",
              transition: "background-color 0.3s, color 0.3s",
            }}
          >
            &laquo;
          </button>

          {/* Previous Page Button */}
          <button
            disabled={currentPage === 1}
            onClick={() => {
              if (queryString) {
                handleQuery(queryString, currentPage - 1); // Handle search pagination
              } else if (currentSource.length === 0) {
                fetchData(currentPage - 1); // Navigate to the previous page
              } else {
                handleSortBy(currentSource.join(","), currentPage - 1); // Navigate to the previous page with sorting
              }
            }}
            style={{
              marginRight: "10px",
              border: "1px solid #58afe2",
              color: currentPage === 1 ? "#aaa" : "#58afe2",
              backgroundColor: currentPage === 1 ? "#f0f0f0" : "#fff",
              padding: "8px 15.5px",
              borderRadius: "11rem",
              cursor: currentPage === 1 ? "default" : "pointer",
              transition: "background-color 0.3s, color 0.3s",
            }}
          >
            &lsaquo;
          </button>

          {/* Page Number Buttons */}
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => {
                if (queryString) {
                  handleQuery(queryString, page); // Handle search pagination
                } else if (currentSource.length === 0) {
                  fetchData(page); // Fetch data for the selected page
                } else {
                  handleSortBy(currentSource.join(","), page); // Fetch sorted data for the selected page
                }
              }}
              style={{
                margin: "0 5px",
                fontWeight: currentPage === page ? "bold" : "normal",
                color: currentPage === page ? "#fff" : "#58afe2",
                backgroundColor: currentPage === page ? "#58afe2" : "#fff",
                border: "1px solid #58afe2",
                padding: "8px 15.5px",
                borderRadius: "11rem",
                cursor: "pointer",
                transition: "background-color 0.3s, color 0.3s",
              }}
            >
              {page}
            </button>
          ))}
          {/* Next Page Button */}
          <button
            disabled={currentPage === Math.ceil(totalRecords / resultsPerPage)}
            onClick={() => {
              if (queryString) {
                handleQuery(queryString, currentPage + 1); // Handle search pagination
              } else if (currentSource.length === 0) {
                fetchData(currentPage + 1); // Navigate to the next page
              } else {
                handleSortBy(currentSource.join(","), currentPage + 1); // Navigate to the next page with sorting
              }
            }}
            style={{
              marginLeft: "10px",
              border: "1px solid #58afe2",
              color:
                currentPage === Math.ceil(totalRecords / resultsPerPage)
                  ? "#aaa"
                  : "#58afe2",
              backgroundColor:
                currentPage === Math.ceil(totalRecords / resultsPerPage)
                  ? "#f0f0f0"
                  : "#fff",
              padding: "8px 15.5px",
              borderRadius: "11rem",
              cursor:
                currentPage === Math.ceil(totalRecords / resultsPerPage)
                  ? "default"
                  : "pointer",
              transition: "background-color 0.3s, color 0.3s",
            }}
          >
            &rsaquo;
          </button>

          {/* Last Page Button */}
          <button
            disabled={currentPage === Math.ceil(totalRecords / resultsPerPage)}
            onClick={() => {
              const lastPage = Math.ceil(totalRecords / resultsPerPage);
              if (queryString) {
                handleQuery(queryString, lastPage); // Handle search pagination
              } else if (currentSource.length === 0) {
                fetchData(lastPage); // Navigate to the last page
              } else {
                handleSortBy(currentSource.join(","), lastPage); // Navigate to the last page with sorting
              }
            }}
            style={{
              marginLeft: "10px",
              border: "1px solid #58afe2",
              color:
                currentPage === Math.ceil(totalRecords / resultsPerPage)
                  ? "#aaa"
                  : "#58afe2",
              backgroundColor:
                currentPage === Math.ceil(totalRecords / resultsPerPage)
                  ? "#f0f0f0"
                  : "#fff",
              padding: "8px 12px",
              borderRadius: "11rem",
              cursor:
                currentPage === Math.ceil(totalRecords / resultsPerPage)
                  ? "default"
                  : "pointer",
              transition: "background-color 0.3s, color 0.3s",
            }}
          >
            &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;

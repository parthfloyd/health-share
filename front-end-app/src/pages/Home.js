import React, { useState, useEffect, useCallback } from "react";
import DisplayTable from "../components/DisplayTable";
import HomeIcon from "@mui/icons-material/Home";
import DownloadIcon from "@mui/icons-material/Download";
import { Menu, MenuItem } from "@mui/material";
import { utils, writeFile } from "xlsx";
import SearchIcon from "@mui/icons-material/Search";
import API_URL from "../apis/api";

function Home() {
  const [data, setData] = useState([]);
  const [queryString, setQueryString] = useState("");
  const [anchorEl, setAnchorEl] = useState(null); // Anchor element for the menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleClearSearch = () => {
    setQueryString(""); // Set query string to an empty string
  };

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(API_URL + "/healthshare/api/alldata", {
        mode: "cors",
      });
      const result = await response.json();
      console.log(result);
      setData(result);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuery = async (query) => {
    try {
      // const url = new URL(API_URL + "/healthshare/api/querydata");
      // url.searchParams.append("query", query);
      const response = await fetch(API_URL + `/healthshare/api/querydata?query=${query}`, {
        mode: "cors",
      });
      const result = await response.json();
      console.log(result);
      setData(result);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };

  const handleSortBy = async (source) => {
    try {
      // const url = new URL(API_URL + `/healthshare/api/sortbysource?source=${source}`);
      // url.searchParams.append("source", source);
      const response = await fetch(API_URL + `/healthshare/api/sortbysource?source=${source}`, {
        mode: "cors",
      });
      const result = await response.json();
      console.log(result);
      setData(result);
      handleMenuClose();
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };
  const handleExport = async () => {
    const headings = [["Id", "Text", "Created at", "Source"]];
    const wb = utils.book_new();
    const ws = utils.json_to_sheet([]);
    utils.sheet_add_aoa(ws, headings);
    utils.sheet_add_json(ws, data, { origin: "A2", skipHeader: true });
    utils.book_append_sheet(wb, ws, "Data");
    writeFile(wb, "Data.xlsx");
  };

  return (
    <div className="m-5 mb-5">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px",
          backgroundColor: "#58afe2",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <HomeIcon
            style={{ marginRight: "10px", fontSize: "2rem", cursor: "pointer" }}
            onClick={() => {
              fetchData();
              handleClearSearch(); // Clear the search bar input
            }}
          />
          <input
            type="search"
            id="query"
            style={{
              marginLeft: "49rem",
              padding: "8px",
              borderRadius: "25px",
              border: "none",
              width: "320px",
              fontSize: "13px",
            }}
            placeholder="Please enter your query"
            aria-label="Search"
            aria-describedby="search-addon"
            value={queryString}
            onChange={(e) => setQueryString(e.target.value)}
          />
          <SearchIcon
            style={{
              marginLeft: "8px",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "white",
            }}
            onClick={() => queryString && handleQuery(queryString)}
          />
        </div>
        <div>
          <button
            style={{
              padding: "8px",
              borderRadius: "50px", // Adjust the borderRadius for a more rounded appearance
              fontWeight: "bold",
              border: "none",
              backgroundColor: "#58afe2",
              color: "white",
              cursor: "pointer",
              fontSize: "15px", // Adjust the fontSize for smaller text
            }}
            onClick={handleMenuOpen}
          >
            Sort By
          </button>
          <DownloadIcon
            style={{ marginLeft: "10px", fontSize: "2rem", cursor: "pointer" }}
            onClick={handleExport}
          />
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleSortBy("Twitter")}>
              Twitter Data
            </MenuItem>
            <MenuItem onClick={() => handleSortBy("Facebook")}>
              Facebook Data
            </MenuItem>
            <MenuItem onClick={() => handleSortBy("Medium")}>
              Articles Data
            </MenuItem>
          </Menu>
        </div>
      </div>

      <div style={{ paddingTop: "30px" }}>
        <DisplayTable data={data} />
      </div>
    </div>
  );
}

export default Home;

import React, { useState, useEffect, useRef } from "react";
import { Card, Spinner, Alert, Badge, ButtonGroup, Button } from "react-bootstrap";
import * as d3 from "d3";
import { FaChartBar, FaSyncAlt } from "react-icons/fa";
import API_URL from "../../apis/api";
import { emotionColors } from "./emotionColors";

const EmotionBarChart = ({ searchParams }) => {
  const [data, setData] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [interval, setInterval] = useState("week");
  const [totalCount, setTotalCount] = useState(0);

  const chartRef = useRef();

  useEffect(() => {
    if (searchParams) fetchBarChartData();
  }, [searchParams, interval]);

  const fetchBarChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();

      if (searchParams.sources) {
        const normalizedSources = searchParams.sources.map(s => s.value || s);
        queryParams.set("sources", normalizedSources.join(","));
      }

      if (searchParams.startDate) queryParams.set("startDate", searchParams.startDate);
      if (searchParams.endDate) queryParams.set("endDate", searchParams.endDate);

      if (searchParams.emotions) {
        const emoList = Array.isArray(searchParams.emotions)
          ? searchParams.emotions
          : [searchParams.emotions];
        if (!emoList.includes("All")) {
          queryParams.set("emotions", emoList.join(","));
        }
      }

      queryParams.set("interval", interval);

      const response = await fetch(
        `${API_URL}/healthshare/api/emotion-trends?${queryParams.toString()}`
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API failed (${response.status}): ${text}`);
      }

      const result = await response.json();

      const normalized = (result.data || []).map(row => {
        const newRow = { period: row.period };
        Object.keys(row).forEach(key => {
          if (key !== "period") newRow[key] = row[key];
        });
        return newRow;
      });

      setData(normalized);

      const emotionKeys = new Set();
      normalized.forEach(row => {
        Object.keys(row).forEach(k => {
          if (k !== "period") emotionKeys.add(k);
        });
      });

      setEmotions([...emotionKeys]);

      const total = normalized.reduce(
        (sum, row) =>
          sum +
          Object.keys(row)
            .filter(k => k !== "period")
            .reduce((acc, k) => acc + (row[k] || 0), 0),
        0
      );
      setTotalCount(total);
    } catch (err) {
      console.error("Bar Chart Fetch Error:", err);
      setError("Failed to fetch bar chart data.");
    } finally {
      setLoading(false);
    }
  };

  // D3 Rendering
  useEffect(() => {
    if (!data.length || !chartRef.current) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = svg.node().clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const stackedKeys = emotions;

    const formattedData = data.map(row => {
      const fixed = { period: row.period };
      stackedKeys.forEach(key => {
        fixed[key] = row[key] || 0;
      });
      return fixed;
    });

    const stackedData = d3.stack().keys(stackedKeys)(formattedData);

    const x = d3.scaleBand()
      .domain(data.map(d => d.period))
      .range([0, width])
      .padding(0.25);

    const y = d3.scaleLinear()
      .domain([
        0,
        d3.max(stackedData, layer => d3.max(layer, d => d[1])) || 0,
      ])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(stackedKeys)
      .range(stackedKeys.map(k => emotionColors[k] || "#777"));

    // Bars
    g.selectAll("g.layer")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter()
      .append("rect")
      .attr("x", d => x(d.data.period))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .attr("opacity", 0.9);

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end");

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(y));

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${height + margin.top + 30})`);

    legend
      .selectAll("g")
      .data(stackedKeys)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(${i * 120}, 0)`)
      .each(function (key) {
        const g = d3.select(this);
        g.append("rect")
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", color(key));
        g.append("text")
          .attr("x", 20)
          .attr("y", 12)
          .text(key);
      });

  }, [data, emotions]);

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Card.Title className="d-flex align-items-center mb-0">
            <FaChartBar className="me-2 text-primary" />
            Emotion Trends Over Time
          </Card.Title>

          {totalCount > 0 && (
            <Badge bg="primary" className="fs-6">{totalCount} posts</Badge>
          )}
        </div>

        <div className="mb-3 text-end">
          <ButtonGroup size="sm">
            <Button
              variant={interval === "week" ? "primary" : "outline-secondary"}
              onClick={() => setInterval("week")}
            >
              Weekly
            </Button>
            <Button
              variant={interval === "month" ? "primary" : "outline-secondary"}
              onClick={() => setInterval("month")}
            >
              Monthly
            </Button>
            <Button variant="outline-secondary" onClick={fetchBarChartData}>
              <FaSyncAlt />
            </Button>
          </ButtonGroup>
        </div>

        {loading ? (
          <Spinner className="mt-3" />
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <svg ref={chartRef} width="100%" height="450"></svg>
        )}
      </Card.Body>
    </Card>
  );
};

export default EmotionBarChart;

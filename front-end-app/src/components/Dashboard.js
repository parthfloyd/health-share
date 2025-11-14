import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner, Card, Button } from 'react-bootstrap';
import { FaChartPie, FaChartLine, FaTachometerAlt, FaInfoCircle, FaShareAlt } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import AdvancedSearch from './AdvancedSearch';
import ComparisonView from './ComparisonView';
import '../styles/ComparisonView.css';

const Dashboard = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Utility function to sanitize search parameters
  const sanitizeSearchParams = (params) => {
    if (!params) return null;
    const sanitized = { ...params };

    if (sanitized.startDate === '') sanitized.startDate = null;
    if (sanitized.endDate === '') sanitized.endDate = null;
    if (!sanitized.sources) sanitized.sources = [];
    if (!sanitized.emotions) sanitized.emotions = 'All';
    if (!sanitized.label) sanitized.label = 'Unnamed Query';

    return sanitized;
  };

  // ✅ Prepare visualization data
  const prepareVisualizationData = (queries) => {
    if (!Array.isArray(queries)) queries = [queries];

    return queries.map((query) => {
      const sanitized = sanitizeSearchParams(query);
      return {
        ...sanitized,
        sources: sanitized.sources || [],
        startDate: sanitized.startDate || '',
        endDate: sanitized.endDate || '',
        queryId: `query-${Math.random().toString(36).substr(2, 9)}`
      };
    });
  };

  // ✅ Load snapshot from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const snapshot = params.get('data');
    if (snapshot) {
      try {
        const decoded = JSON.parse(decodeURIComponent(snapshot));
        setSearchPerformed(true);
        const processed = prepareVisualizationData(decoded);
        setSearchResults(processed);
      } catch (err) {
        console.error('Error loading snapshot:', err);
        setError('Failed to load shared snapshot.');
      }
    }
  }, [location.search]);

  // ✅ Handle new search
  const handleSearch = (queries) => {
    setLoading(true);
    setError(null);
    setSearchPerformed(true);

    // Simulate API delay
    setTimeout(() => {
      try {
        const processedQueries = prepareVisualizationData(queries);
        setSearchResults(processedQueries);
        setLoading(false);

        // Save snapshot to URL for sharing
        const snapshot = encodeURIComponent(JSON.stringify(queries));
        navigate(`?data=${snapshot}`, { replace: true });
      } catch (err) {
        console.error('Error processing search:', err);
        setError('An error occurred while processing your search. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  // ✅ Copy snapshot link to clipboard
  const handleShareSnapshot = () => {
    const snapshotUrl = window.location.href;
    navigator.clipboard.writeText(snapshotUrl);
    alert('✅ Dashboard snapshot link copied to clipboard!');
  };

  return (
    <div className="dashboard-container">
      {/* ===== HEADER ===== */}
      <div className="dashboard-header text-center">
        <Container fluid>
          <Row className="justify-content-center">
            <Col xs={12} lg={10}>
              <h2 className="dashboard-title">
                <FaTachometerAlt className="me-2" /> Visual Analytics Dashboard
              </h2>
              <p className="dashboard-subtitle">
                Analyze and compare health-related social media trends, emotions, and topics across different sources and time periods.
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <Container fluid>
        <Row className="justify-content-center">
          <Col xs={12} lg={12}>
            {/* === SEARCH CARD === */}
            <Card className="search-card mb-3 shadow-sm">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaChartLine className="me-2" /> Advanced Search
                  </h5>
                  <div className="text-white small d-none d-md-block">
                    <FaInfoCircle className="me-1" /> Configure your visualization parameters
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <AdvancedSearch onSearch={handleSearch} />
              </Card.Body>
            </Card>

            {/* === ERROR === */}
            {error && (
              <Alert variant="danger" className="mt-3 fade-in">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
              </Alert>
            )}

            {/* === LOADING === */}
            {loading ? (
              <div className="text-center p-4 fade-in bg-light rounded shadow-sm mb-3">
                <Spinner
                  animation="border"
                  role="status"
                  variant="primary"
                  style={{ width: '3rem', height: '3rem' }}
                >
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3 text-primary fw-bold">
                  Processing your search request...
                </p>
                <p className="text-muted">
                  This may take a few moments depending on the amount of data.
                </p>
                <div className="progress mt-3" style={{ height: '6px' }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            ) : searchPerformed && searchResults.length > 0 ? (
              <div className="slide-in">
                {/* === SHARE SNAPSHOT BUTTON === */}
                <div className="text-end mb-3">
                  <Button variant="outline-primary" onClick={handleShareSnapshot}>
                    <FaShareAlt className="me-2" /> Share Dashboard Snapshot
                  </Button>
                </div>
                <ComparisonView searchResults={searchResults} />
              </div>
            ) : searchPerformed ? (
              <Alert variant="info" className="mt-3 fade-in">
                <Alert.Heading>No Results Found</Alert.Heading>
                <p>Please try adjusting your search criteria or selecting different data sources.</p>
              </Alert>
            ) : (
              <div className="text-center p-4 bg-light rounded shadow-sm mt-3">
                <FaChartPie size={40} className="text-secondary mb-3" />
                <h4>Ready to Visualize</h4>
                <p className="text-muted">
                  Configure your search parameters above and click "Search & Visualize" to get started.
                </p>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;

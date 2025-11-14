import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import {
  FaChartPie,
  FaCloud,
  FaSpider,
  FaChartLine,
  FaChartBar
} from 'react-icons/fa';

import EmotionPieChart from './visualizations/EmotionPieChart';
import EmotionWordCloud from './visualizations/EmotionWordCloud';
import EmotionSpiderWheel from './visualizations/EmotionSpiderWheel';
import EmotionTimeline from './visualizations/EmotionTimeline';
import EmotionBarChart from './visualizations/EmotionBarChart';
import '../styles/ComparisonView.css';

const ComparisonView = ({ searchResults }) => {
  const [activeVisualization, setActiveVisualization] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!searchResults || searchResults.length === 0) return null;

  const hasDateRange = searchResults.some(r => r.startDate && r.endDate);

  const getColSize = (count) => {
    if (count === 1) return { xs: 12, md: 12 };
    if (count === 2) return { xs: 12, md: 6 };
    if (count === 3) return { xs: 12, md: 6, lg: 4 };
    return { xs: 12, md: 6, lg: 4, xl: 3 };
  };

  const showMobileSelector = windowWidth < 768 && searchResults.length > 1;
  const colSize = getColSize(searchResults.length);

  return (
    <Container fluid className="mb-4 p-0 fade-in">
      {/* ===== MOBILE VISUALIZATION SELECTOR ===== */}
      {showMobileSelector && (
        <div className="mb-3">
          <Alert variant="info" className="py-2 px-3 d-md-none">
            <p className="mb-2 small">
              <strong>Tip:</strong> Select which visualization to view:
            </p>
            <div className="d-flex justify-content-between mt-2 flex-wrap">
              <button
                className={`viz-selector-btn ${activeVisualization === 'pie' || !activeVisualization ? 'active' : ''}`}
                onClick={() => setActiveVisualization('pie')}
              >
                <FaChartPie size={18} /><span>Distribution</span>
              </button>
              <button
                className={`viz-selector-btn ${activeVisualization === 'word' ? 'active' : ''}`}
                onClick={() => setActiveVisualization('word')}
              >
                <FaCloud size={18} /><span>Word Cloud</span>
              </button>
              <button
                className={`viz-selector-btn ${activeVisualization === 'spider' ? 'active' : ''}`}
                onClick={() => setActiveVisualization('spider')}
              >
                <FaSpider size={18} /><span>Spider</span>
              </button>
              {hasDateRange && (
                <>
                  <button
                    className={`viz-selector-btn ${activeVisualization === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveVisualization('timeline')}
                  >
                    <FaChartLine size={18} /><span>Timeline</span>
                  </button>
                  <button
                    className={`viz-selector-btn ${activeVisualization === 'bar' ? 'active' : ''}`}
                    onClick={() => setActiveVisualization('bar')}
                  >
                    <FaChartBar size={18} /><span>Bar Chart</span>
                  </button>
                </>
              )}
            </div>
          </Alert>
        </div>
      )}

      {/* ===== EMOTION DISTRIBUTION ===== */}
      {(!showMobileSelector || activeVisualization === 'pie' || !activeVisualization) && (
        <div className="comparison-section">
          <h4 className="comparison-section-title">
            <FaChartPie className="me-2 text-danger" /> Emotion Distribution Comparison
          </h4>
          <Row className="g-3">
            {searchResults.map((result, index) => (
              <Col key={`pie-${index}`} {...colSize}>
                <Card className="comparison-card h-100 shadow-sm">
                  <Card.Body>
                    <EmotionPieChart searchParams={result} />
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* ===== WORD CLOUD ===== */}
      {(!showMobileSelector || activeVisualization === 'word') && (
        <div className="comparison-section">
          <h4 className="comparison-section-title">
            <FaCloud className="me-2 text-success" /> Emotion Word Cloud
          </h4>
          <Row className="g-3">
            {searchResults.map((result, index) => (
              <Col key={`word-${index}`} {...colSize}>
                <Card className="comparison-card h-100 shadow-sm">
                  <Card.Body>
                    <EmotionWordCloud searchParams={result} />
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* ===== SPIDER WHEEL ===== */}
      {(!showMobileSelector || activeVisualization === 'spider') && (
        <div className="comparison-section">
          <h4 className="comparison-section-title">
            <FaSpider className="me-2 text-info" /> Emotion Spider Wheel
          </h4>
          <Row className="g-3">
            {searchResults.map((result, index) => (
              <Col key={`spider-${index}`} {...colSize}>
                <Card className="comparison-card h-100 shadow-sm">
                  <Card.Body>
                    <EmotionSpiderWheel searchParams={result} />
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* ===== TIMELINE ===== */}
      {hasDateRange && (!showMobileSelector || activeVisualization === 'timeline') && (
        <div className="comparison-section">
          <h4 className="comparison-section-title">
            <FaChartLine className="me-2 text-primary" /> Emotion Timeline
          </h4>
          <Row className="g-3">
            {searchResults
              .filter(r => r.startDate && r.endDate)
              .map((result, index) => (
                <Col key={`timeline-${index}`} xs={12}>
                  <Card className="comparison-card shadow-sm">
                    <Card.Body>
                      <EmotionTimeline searchParams={result} />
                    </Card.Body>
                  </Card>
                </Col>
              ))}
          </Row>
        </div>
      )}

      {/* ===== BAR CHART ===== */}
      {hasDateRange && (!showMobileSelector || activeVisualization === 'bar') && (
        <div className="comparison-section">
          <h4 className="comparison-section-title">
            <FaChartBar className="me-2 text-warning" /> Emotion Trends Over Time
          </h4>
          <Row className="g-3">
            {searchResults
              .filter(r => r.startDate && r.endDate)
              .map((result, index) => (
                <Col key={`bar-${index}`} xs={12}>
                  <Card className="comparison-card shadow-sm">
                    <Card.Body>
                      <EmotionBarChart searchParams={result} />
                    </Card.Body>
                  </Card>
                </Col>
              ))}
          </Row>
        </div>
      )}
    </Container>
  );
};

export default ComparisonView;

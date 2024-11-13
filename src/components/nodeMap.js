import { useEffect, useState } from "react";
import { Spinner, Container, Row, Col } from "react-bootstrap";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const NodeMap = () => {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [versionStats, setVersionStats] = useState({
    total: 0,
    v14: 0,
    v15: 0,
    v16: 0,
    v17: 0,
  });
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await fetch("http://localhost:8000");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        setLastUpdate(data.updated_at);

        // remove duplicate nodes
        const uniqueNodes = new Map();
        const filteredNodes = Object.values(data.nodes)
          .filter((node) => node.loc && node.id)
          .map((node) => {
            const [lat, lng] = node.loc.split(",").map(Number);
            const version = node.spectred?.split(":")[1]?.split("/")[0];
            return !isNaN(lat) && !isNaN(lng)
              ? {
                  id: node.id,
                  lat,
                  lng,
                  version,
                  color: getColorByVersion(version),
                }
              : null;
          })
          .filter(Boolean)
          .filter((node) => {
            if (uniqueNodes.has(node.id)) return false;
            uniqueNodes.set(node.id, true);
            return true;
          });

        setNodes(filteredNodes);
        setVersionStats({
          total: filteredNodes.length,
          v14: filteredNodes.filter((n) => n.version === "0.3.14").length,
          v15: filteredNodes.filter((n) => n.version === "0.3.15").length,
          v16: filteredNodes.filter((n) => n.version === "0.3.16").length,
          v17: filteredNodes.filter((n) => n.version === "0.3.17").length,
        });
      } catch (error) {
        console.error("Error fetching nodes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();
  }, []);

  const getColorByVersion = (version) => {
    switch (version) {
      case "0.3.14":
        return "red";
      case "0.3.15":
        return "orange";
      case "0.3.16":
        return "green";
      case "0.3.17":
        return "yellow";
      default:
        return "blue";
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return "Unknown";
    const elapsed = Math.floor(Date.now() / 1000) - lastUpdate;
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    return `${hours}h ${minutes}m ${seconds}s ago`;
  };

  return (
    <div className="node-map-page">
      <Container className="webpage px-md-5 blocks-page-overview" fluid>
        <div className="block-overview mb-4">
          <h4 className="block-overview-header text-center w-100 mt-4">
            Node Distribution
          </h4>

          <Row className="mb-3 text-center">
            <Col style={{ whiteSpace: "nowrap" }}>
              <strong>Total:</strong> {versionStats.total}
            </Col>
            <Col style={{ color: "red", whiteSpace: "nowrap" }}>
              <strong>v0.3.14:</strong> {versionStats.v14}
            </Col>
            <Col style={{ color: "orange", whiteSpace: "nowrap" }}>
              <strong>v0.3.15:</strong> {versionStats.v15}
            </Col>
            <Col style={{ color: "green", whiteSpace: "nowrap" }}>
              <strong>v0.3.16:</strong> {versionStats.v16}
            </Col>
            <Col style={{ color: "yellow", whiteSpace: "nowrap" }}>
              <strong>v0.3.17:</strong> {versionStats.v17}
            </Col>
          </Row>

          <div className="block-overview-content">
            {loading ? (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : (
              <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ width: "100%", height: "600px" }}
                scrollWheelZoom
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {nodes.map((node) => (
                  <CircleMarker
                    key={node.id}
                    center={[node.lat, node.lng]}
                    radius={5}
                    color={node.color}
                    fillOpacity={0.7}
                    stroke
                  >
                    <Popup>
                      <strong>v:</strong> {node.version}
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>

          <div className="text-center mt-3">
            <small>
              <strong>Last updated:</strong> {formatLastUpdate()}
            </small>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default NodeMap;

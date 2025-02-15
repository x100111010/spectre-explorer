import { useEffect, useState } from "react";
import { Spinner, Container, Row, Col } from "react-bootstrap";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getNodes } from "../spectre-api-client";

const NodeMap = () => {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [versionStats, setVersionStats] = useState({});
  const [nodeTypeStats, setNodeTypeStats] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const initNodeMap = async () => {
      try {
        const data = await getNodes();

        // first node timestamp as last update timestamp
        if (data.length > 0 && data[0].metadata?.timestamp) {
          setLastUpdate(new Date(data[0].metadata.timestamp).getTime() / 1000);
        }

        const validNodes = data
          .map((node) => {
            if (!node.loc) return null; // skip if loc missing
            const [lat, lng] = node.loc.split(",").map(Number);

            // split ip and port
            const [ip, port] = node.ip.split(":");

            // version from metadata.user_agent
            const version = node.metadata.user_agent
              ?.split(":")[1]
              ?.split("/")[0];

            return !isNaN(lat) && !isNaN(lng)
              ? {
                  lat,
                  lng,
                  ip,
                  port,
                  version,
                  protocolVersion: node.metadata.protocol_version,
                  color: "#ff015a",
                }
              : null;
          })
          .filter(Boolean);

        // version stats
        const versionCounts = validNodes.reduce((acc, node) => {
          if (node.version) {
            acc[node.version] = (acc[node.version] || 0) + 1;
          }
          return acc;
        }, {});

        // node type stats
        const nodeTypeCounts = validNodes.reduce(
          (acc, node) => {
            if (node.protocolVersion === 5) acc.goNodes++;
            if (node.protocolVersion === 6) acc.rustNodes++;
            return acc;
          },
          { goNodes: 0, rustNodes: 0 },
        );

        nodeTypeCounts.total = validNodes.length;
        nodeTypeCounts.goPercentage = (
          (nodeTypeCounts.goNodes / validNodes.length) *
          100
        ).toFixed(2);
        nodeTypeCounts.rustPercentage = (
          (nodeTypeCounts.rustNodes / validNodes.length) *
          100
        ).toFixed(2);

        setNodes(validNodes);
        setVersionStats({
          total: validNodes.length,
          ...versionCounts,
        });
        setNodeTypeStats(nodeTypeCounts);
      } catch (error) {
        console.error("Error fetching nodes:", error);
      } finally {
        setLoading(false);
      }
    };

    initNodeMap();
  }, []);

  const formatLastUpdate = () => {
    if (!lastUpdate) return "Unknown";
    const elapsed = Math.floor(Date.now() / 1000) - lastUpdate;
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    return `${hours}h ${minutes}m ago`;
  };

  // sort version numbers
  const sortVersions = (versions) => {
    return versions.sort((a, b) => {
      const [a1, a2, a3] = a.split(".").map(Number);
      const [b1, b2, b3] = b.split(".").map(Number);

      if (a1 !== b1) return a1 - b1; // 0
      if (a2 !== b2) return a2 - b2; // 3
      return a3 - b3; // 14
    });
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
              <strong>Total:</strong> {versionStats.total || 0}
            </Col>
            {sortVersions(
              Object.keys(versionStats).filter((key) => key !== "total"),
            ).map((version) => (
              <Col
                key={version}
                style={{
                  whiteSpace: "nowrap",
                  color: "#ff015a",
                }}
              >
                <strong>{version}:</strong> {versionStats[version]}
              </Col>
            ))}
          </Row>
          <Row className="mb-3 text-center">
            <Col style={{ whiteSpace: "nowrap", color: "#79d4fd" }}>
              <strong>Go Nodes:</strong> {nodeTypeStats.goNodes || 0} (
              {nodeTypeStats.goPercentage || 0}%)
            </Col>
            <Col style={{ whiteSpace: "nowrap", color: "#e43716" }}>
              <strong>Rust Nodes:</strong> {nodeTypeStats.rustNodes || 0} (
              {nodeTypeStats.rustPercentage || 0}%)
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
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  subdomains={["a", "b", "c", "d"]}
                  maxZoom={20}
                />
                {nodes.map((node, index) => (
                  <CircleMarker
                    key={index}
                    center={[node.lat, node.lng]}
                    radius={5}
                    color={node.color}
                    fillOpacity={0.7}
                    stroke
                  >
                    <Popup>
                      <div className="popup-content">
                        <strong>IP:</strong> {node.ip}
                        <br />
                        <strong>Port:</strong> {node.port}
                        <br />
                        <strong>v:</strong> {node.version}
                        <br />
                        <strong>Type:</strong>{" "}
                        {node.protocolVersion === 5
                          ? "Go Node"
                          : node.protocolVersion === 6
                            ? "Rust Node"
                            : "Unknown"}
                      </div>
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
            <br />
            <small>
              Map shows public nodes with public IPs and exposed P2P ports
              (:18111) only. Node locations are estimated based on IP addresses
              and may not reflect precise physical locations.
            </small>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default NodeMap;

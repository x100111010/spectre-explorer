import { useEffect, useState } from "react";
import { Spinner, Container, Row, Col } from "react-bootstrap";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getNodes } from "../spectre-api-client";

const NodeMap = () => {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [versionStats, setVersionStats] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const initNodeMap = async () => {
      try {
        const data = await getNodes();
        setLastUpdate(data.updated_at);

        const validNodes = Object.entries(data.nodes)
          .map(([ipPort, node]) => {
            if (!node.loc) return null; // skip if loc missing
            const [lat, lng] = node.loc.split(",").map(Number);

            // split ip6
            let ip, port;
            if (ipPort.startsWith("ipv6:[")) {
              const match = ipPort.match(/^ipv6:\[(.+)]:(\d+)$/);
              if (match) {
                ip = match[1];
                port = match[2];
              }
            } else {
              // split ip4
              [ip, port] = ipPort.split(":");
            }

            const version = node.spectred?.split(":")[1]?.split("/")[0];
            return !isNaN(lat) && !isNaN(lng)
              ? {
                  lat,
                  lng,
                  ip,
                  port,
                  version,
                  protocolVersion: node.protocolVersion,
                  color: getColorByVersion(version),
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

        setNodes(validNodes);
        setVersionStats({
          total: validNodes.length,
          ...versionCounts,
        });
      } catch (error) {
        console.error("Error fetching nodes:", error);
      } finally {
        setLoading(false);
      }
    };

    initNodeMap();
  }, []);

  const getColorByVersion = (version) => {
    if (!version) return "red";

    const seed = version
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // π to create randomness
    const piFactor = Math.PI * seed;
    const hue = Math.floor(((piFactor * 37) % 40) + 0);
    const saturation = 70 + Math.floor(piFactor % 30);
    const lightness = 50 + Math.floor(piFactor % 20);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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
              <strong>Total:</strong> {versionStats.total || 0}
            </Col>
            {Object.entries(versionStats)
              .filter(([key]) => key !== "total")
              .map(([version, count]) => (
                <Col
                  key={version}
                  style={{
                    whiteSpace: "nowrap",
                    color: getColorByVersion(version),
                  }}
                >
                  <strong>{version}:</strong> {count}
                </Col>
              ))}
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

import React, { useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";
import { useNavigate } from "react-router-dom";

const DAGGraph = ({ data, maxVisibleBlocks = 40 }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // calc visible blocks dynamically based on the screen width
    const screenBlockLimit = Math.floor(window.innerWidth / 60);
    const visibleBlockCount = Math.min(maxVisibleBlocks, screenBlockLimit);
    const visibleBlocks = data.slice(-visibleBlockCount);

    // prepare nodes
    const nodes = visibleBlocks.map((block) => ({
      id: block.id,
      label: `${block.id.substring(0, 9)}...`, // block hash
      shape: "box",
      color: {
        background: block.isChain ? "#e6e8ec" : "#ff005a",
        border: "#000",
      },
    }));

    // prepare edges
    const edges = visibleBlocks.flatMap((block) =>
      block.blueparents
        ? block.blueparents
            .filter((parentId) => visibleBlocks.some((b) => b.id === parentId))
            .map((parentId) => ({
              from: parentId,
              to: block.id,
              arrows: "to",
              color: "#e6e8ec",
            }))
        : [],
    );

    const dataSet = { nodes, edges };

    const options = {
      layout: {
        hierarchical: {
          direction: "LR",
          sortMethod: "directed",
          nodeSpacing: 100,
          levelSeparation: 150,
        },
      },
      interaction: {
        dragNodes: false,
        zoomView: false,
        dragView: false,
      },
      physics: {
        enabled: true,
        hierarchicalRepulsion: {
          nodeDistance: 120,
        },
      },
      nodes: {
        borderWidth: 1,
        shape: "box",
        font: {
          size: 14,
          face: "monospace",
          align: "center",
          color: "#000000",
        },
        widthConstraint: 50,
        heightConstraint: 50,
      },
      edges: {
        color: "#116466",
        arrows: { to: { enabled: true, type: "arrow" } },
        smooth: {
          type: "cubicBezier",
          forceDirection: "horizontal",
          roundness: 0.5,
        },
      },
    };

    if (networkRef.current) {
      networkRef.current.setData(dataSet);
      networkRef.current.setOptions({ physics: { enabled: true } });

      networkRef.current.once("stabilizationIterationsDone", () => {
        networkRef.current.setOptions({ physics: { enabled: false } });
      });
    } else {
      networkRef.current = new Network(containerRef.current, dataSet, options);

      networkRef.current.on("click", (params) => {
        if (params.nodes.length > 0) {
          navigate(`/blocks/${params.nodes[0]}`);
        }
      });

      networkRef.current.once("stabilizationIterationsDone", () => {
        networkRef.current.setOptions({ physics: { enabled: false } });
      });
    }
  }, [data, maxVisibleBlocks, navigate]);

  return <div className="graph-container" ref={containerRef}></div>;
};

export default DAGGraph;

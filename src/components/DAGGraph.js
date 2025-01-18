import React, { useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";
import { useNavigate } from "react-router-dom";

const DAGGraph = ({ data, maxVisibleBlocks = 50 }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // calc visible blocks dynamically based on the screen width
    const screenBlockLimit = Math.floor(window.innerWidth / 60); // may need some adjustment
    const visibleBlockCount = Math.min(maxVisibleBlocks, screenBlockLimit);
    const visibleBlocks = data.slice(-visibleBlockCount);

    // helper for node color
    const getNodeColor = (block) => {
      if (block.isRed) {
        return "#ff005a";
      }
      return "#bfe6ff"; // default to blue
    };

    // helper for edge color
    const getEdgeColor = (parentId, block) => {
      const parentBlock = visibleBlocks.find(
        (parent) => parent.id === parentId,
      );

      if (parentBlock.isRed) {
        return "#ff005a"; // red parent
      }

      if (block.isChain) {
        return "#4cc9f0"; // chained blocks
      }

      return "#808080"; // non-chained blocks
    };

    // prepare nodes
    const nodes = visibleBlocks.map((block) => ({
      id: block.id,
      label: `${block.id.slice(0, 4)}\n${block.id.slice(4, 8)}`, // 4x4
      shape: "box",
      color: {
        background: getNodeColor(block),
        border: "#000",
      },
    }));

    // prepare edges
    const edges = visibleBlocks.flatMap((block) =>
      [...(block.redparents || []), ...(block.blueparents || [])]
        .filter((parentId) => visibleBlocks.some((b) => b.id === parentId))
        .map((parentId) => ({
          from: parentId,
          to: block.id,
          arrows: "from",
          color: getEdgeColor(parentId, block),
        })),
    );

    const dataSet = { nodes, edges };

    const options = {
      layout: {
        hierarchical: {
          direction: "LR",
          sortMethod: "directed",
          nodeSpacing: 100,
          levelSeparation: 120,
        },
      },
      interaction: {
        dragNodes: false,
        zoomView: false,
        dragView: false,
        multiselect: false,
        selectable: true,
        hover: false,
        hoverConnectedEdges: false,
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
          size: 18,
          face: "monospace",
          align: "center",
          color: "#000000",
        },
        widthConstraint: 60,
        heightConstraint: 60,
      },
      edges: {
        color: "#116466",
        arrows: { to: { enabled: true, type: "arrow" } },
        width: 2,
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
        networkRef.current.fit({
          animation: {
            duration: 500,
            easingFunction: "easeInOutQuad",
          },
        });
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
        networkRef.current.fit({
          animation: {
            duration: 500,
            easingFunction: "easeInOutQuad",
          },
        });
      });
    }
  }, [data, maxVisibleBlocks, navigate]);

  return <div className="graph-container" ref={containerRef}></div>;
};

export default DAGGraph;

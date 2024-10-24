import { faDiagramProject } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState, useCallback } from "react";
import {
  getBlockdagInfo,
  getHashrateMax,
  getSpectredInfo,
} from "../spectre-api-client";
import { BPS } from "../constants";

const BlockDAGBox = () => {
  const [networkName, setNetworkName] = useState("");
  const [virtualDaaScore, setVirtualDaaScore] = useState("");
  const [hashrate, setHashrate] = useState("");
  const [maxHashrate, setMaxHashrate] = useState("");
  const [mempool, setMempool] = useState("");

  const formatHashrateValue = (hashrateInHashesPerSecond, decimals) => {
    let hashrateValue = hashrateInHashesPerSecond;
    let unit = "H/s"; // default H/s

    if (hashrateValue >= 1e9) {
      hashrateValue = hashrateValue / 1e9;
      unit = "GH/s";
    } else if (hashrateValue >= 1e6) {
      hashrateValue = hashrateValue / 1e6;
      unit = "MH/s";
    } else if (hashrateValue >= 1e3) {
      hashrateValue = hashrateValue / 1e3;
      unit = "KH/s";
    }

    return `${hashrateValue.toFixed(decimals)} ${unit}`;
  };

  // load cached data if available
  const loadCachedData = useCallback(() => {
    const cachedDagInfo = localStorage.getItem("dag_info");
    const cachedHashrateMax = localStorage.getItem("hashrate_max");
    const cachedSpectredInfo = localStorage.getItem("spectred_info");

    if (cachedDagInfo) {
      const dag_info = JSON.parse(cachedDagInfo);
      setNetworkName(dag_info.networkName);
      setVirtualDaaScore(dag_info.virtualDaaScore);
      const hashrateInHashesPerSecond = dag_info.difficulty * 2 * BPS;
      setHashrate(formatHashrateValue(hashrateInHashesPerSecond, 2));
    }

    if (cachedHashrateMax) {
      const hashrateMax = JSON.parse(cachedHashrateMax);
      const maxHashrateInHashesPerSecond = hashrateMax.hashrate * 1e12; // getHashrateMax TH/s -> H/s
      setMaxHashrate(formatHashrateValue(maxHashrateInHashesPerSecond, 2));
    }

    if (cachedSpectredInfo) {
      const spectredInfo = JSON.parse(cachedSpectredInfo);
      setMempool(spectredInfo.mempoolSize);
    }
  }, []);

  const initBox = useCallback(async () => {
    const dag_info = await getBlockdagInfo();
    const hashrateMax = await getHashrateMax();
    const spectredInfo = await getSpectredInfo();

    // cache in localStorage
    localStorage.setItem("dag_info", JSON.stringify(dag_info));
    localStorage.setItem("hashrate_max", JSON.stringify(hashrateMax));
    localStorage.setItem("spectred_info", JSON.stringify(spectredInfo));

    setNetworkName(dag_info.networkName);
    setVirtualDaaScore(dag_info.virtualDaaScore);

    const hashrateInHashesPerSecond = dag_info.difficulty * 2 * BPS;
    setHashrate(formatHashrateValue(hashrateInHashesPerSecond, 2));

    const maxHashrateInHashesPerSecond = hashrateMax.hashrate * 1e12;
    setMaxHashrate(formatHashrateValue(maxHashrateInHashesPerSecond, 2));

    setMempool(spectredInfo.mempoolSize);
  }, []);

  useEffect(() => {
    // init cache
    loadCachedData();

    // update from api
    initBox();

    const updateInterval = setInterval(async () => {
      const dag_info = await getBlockdagInfo();
      const hashrateMax = await getHashrateMax();

      // cache new dag_info and update state
      localStorage.setItem("dag_info", JSON.stringify(dag_info));
      localStorage.setItem("hashrate_max", JSON.stringify(hashrateMax));

      setNetworkName(dag_info.networkName);
      setVirtualDaaScore(dag_info.virtualDaaScore);

      const hashrateInHashesPerSecond = dag_info.difficulty * 2 * BPS;
      setHashrate(formatHashrateValue(hashrateInHashesPerSecond, 2));

      const maxHashrateInHashesPerSecond = hashrateMax.hashrate * 1e12;
      setMaxHashrate(formatHashrateValue(maxHashrateInHashesPerSecond, 2));
    }, 60000);

    return async () => {
      clearInterval(updateInterval);
    };
  }, [loadCachedData, initBox]);

  useEffect(
    (e) => {
      document.getElementById("virtualDaaScore").animate(
        [
          // keyframes
          { opacity: "1" },
          { opacity: "0.6" },
          { opacity: "1" },
        ],
        {
          // timing options
          duration: 300,
        },
      );
    },
    [virtualDaaScore],
  );

  useEffect(
    (e) => {
      document.getElementById("hashrate").animate(
        [
          // keyframes
          { opacity: "1" },
          { opacity: "0.6" },
          { opacity: "1" },
        ],
        {
          // timing options
          duration: 300,
        },
      );
    },
    [hashrate],
  );

  return (
    <>
      <div className="cardBox mx-0">
        <table style={{ fontSize: "1rem" }}>
          <tr>
            <td
              colspan="2"
              className="text-center"
              style={{ fontSize: "4rem" }}
            >
              <FontAwesomeIcon icon={faDiagramProject} />
              <div className="cardLight" />
            </td>
          </tr>
          <tr>
            <td colspan="2" className="text-center">
              <h3>BLOCKDAG INFO</h3>
            </td>
          </tr>
          <tr>
            <td className="cardBoxElement">Network name</td>
            <td className="pt-1 text-nowrap">{networkName}</td>
          </tr>
          <tr>
            <td className="cardBoxElement">Virtual DAA Score</td>
            <td className="pt-1 align-top" id="virtualDaaScore">
              {virtualDaaScore}
            </td>
          </tr>
          <tr>
            <td className="cardBoxElement">Mempool count</td>
            <td className="pt-1" id="mempool">
              {mempool}
            </td>
          </tr>
          <tr>
            <td className="cardBoxElement">Hashrate</td>
            <td className="pt-1" id="hashrate">
              {hashrate}
            </td>
          </tr>
          <tr>
            <td className="cardBoxElement">Max Hashrate</td>
            <td className="pt-1" id="maxHashrate">
              {maxHashrate}
            </td>
          </tr>
        </table>
      </div>
    </>
  );
};

export default BlockDAGBox;

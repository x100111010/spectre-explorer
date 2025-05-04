import { faDiagramProject } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState, useCallback } from "react";
import moment from "moment";
import {
  getBlockdagInfo,
  getHashrateMax,
  getSpectredInfo,
  getFeeEstimate,
} from "../spectre-api-client";

const BlockDAGBox = () => {
  const [networkName, setNetworkName] = useState("");
  const [virtualDaaScore, setVirtualDaaScore] = useState("");
  const [hashrate, setHashrate] = useState("");
  const [maxHashrate, setMaxHashrate] = useState("");
  const [maxHashrateTimestamp, setMaxHashrateTimestamp] = useState("");
  const [mempool, setMempool] = useState("");
  const [feerate, setFeerate] = useState("");

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
    const cachedFeeEstimate = localStorage.getItem("feerate");

    if (cachedDagInfo) {
      const dag_info = JSON.parse(cachedDagInfo);
      setNetworkName(dag_info.networkName);
      setVirtualDaaScore(dag_info.virtualDaaScore);
      const hashrateInHashesPerSecond = dag_info.difficulty * 2;
      setHashrate(formatHashrateValue(hashrateInHashesPerSecond, 2));
    }

    if (cachedHashrateMax) {
      const hashrateMax = JSON.parse(cachedHashrateMax);
      const maxHashrateInHashesPerSecond = hashrateMax.hashrate * 1e12; // getHashrateMax TH/s -> H/s
      setMaxHashrate(formatHashrateValue(maxHashrateInHashesPerSecond, 2));
      setMaxHashrateTimestamp(hashrateMax.blockheader.timestamp);
    }

    if (cachedSpectredInfo) {
      const spectredInfo = JSON.parse(cachedSpectredInfo);
      setMempool(spectredInfo.mempoolSize);
    }

    if (cachedFeeEstimate) {
      setFeerate(JSON.parse(cachedFeeEstimate));
    }
  }, []);

  const initBox = useCallback(async () => {
    const dag_info = await getBlockdagInfo();
    const hashrateMax = await getHashrateMax();
    const spectredInfo = await getSpectredInfo();
    const feeEstimate = await getFeeEstimate();

    // cache in localStorage
    localStorage.setItem("dag_info", JSON.stringify(dag_info));
    localStorage.setItem("hashrate_max", JSON.stringify(hashrateMax));
    localStorage.setItem("spectred_info", JSON.stringify(spectredInfo));
    localStorage.setItem(
      "feerate",
      JSON.stringify(feeEstimate.priorityBucket.feerate),
    );

    setFeerate(feeEstimate.priorityBucket.feerate);
    setNetworkName(dag_info.networkName);
    setVirtualDaaScore(dag_info.virtualDaaScore);

    const hashrateInHashesPerSecond = dag_info.difficulty * 2;
    setHashrate(formatHashrateValue(hashrateInHashesPerSecond, 2));

    const maxHashrateInHashesPerSecond = hashrateMax.hashrate * 1e12;
    setMaxHashrate(formatHashrateValue(maxHashrateInHashesPerSecond, 2));
    setMaxHashrateTimestamp(hashrateMax.blockheader.timestamp);

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

      const hashrateInHashesPerSecond = dag_info.difficulty * 2;
      setHashrate(formatHashrateValue(hashrateInHashesPerSecond, 2));

      const maxHashrateInHashesPerSecond = hashrateMax.hashrate * 1e12;
      setMaxHashrate(formatHashrateValue(maxHashrateInHashesPerSecond, 2));
      setMaxHashrateTimestamp(hashrateMax.blockheader.timestamp);
    }, 60000);

    const updateInterval2 = setInterval(async () => {
      const feeEstimate = await getFeeEstimate();
      const spectredInfo = await getSpectredInfo();

      setFeerate(feeEstimate.priorityBucket.feerate);
      localStorage.setItem(
        "feerate",
        JSON.stringify(feeEstimate.priorityBucket.feerate),
      );

      setMempool(spectredInfo.mempoolSize);
      localStorage.setItem("mempool", JSON.stringify(spectredInfo.mempoolSize));
    }, 5000);

    return () => {
      clearInterval(updateInterval);
      clearInterval(updateInterval2);
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
          <td className="cardBoxElement">Network name</td>
          <td className="pt-1 text-nowrap" id="networkName">
            {networkName}
          </td>
          <tr>
            <td className="cardBoxElement">Virtual DAA Score</td>
            <td className="pt-1 align-top" id="virtualDaaScore">
              {virtualDaaScore}
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
          <tr>
            <td></td>
            <td className="pt-1">
              <div className="text-start w-100 pe-3 pt-1">
                ^{" "}
                {maxHashrateTimestamp &&
                  moment(maxHashrateTimestamp).format("YYYY-MM-DD HH:mm")}
              </div>
            </td>
          </tr>
          <tr>
            <td className="cardBoxElement">Mempool count</td>
            <td className="pt-1" id="mempool">
              {mempool}
            </td>
          </tr>
          <tr>
            <td className="cardBoxElement">Current Prio Fee</td>
            <td className="pt-1" id="priofeerate">
              {feerate} SPR / gram
            </td>
          </tr>
          <tr>
            <td className="cardBoxElement">Fee for regular TX</td>
            <td className="pt-1" id="normalfeerate">
              ≈{" "}
              {feerate > 300
                ? ((feerate * 3165) / 100000000).toFixed(2)
                : (feerate * 3165) / 100000000}{" "}
              SPR
            </td>
          </tr>
        </table>
      </div>
    </>
  );
};

export default BlockDAGBox;

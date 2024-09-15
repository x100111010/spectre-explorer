import { useEffect, useState, useContext } from "react";
import { Spinner, Container } from "react-bootstrap";
import PriceContext from "./PriceContext";
import { getBlockdagInfo } from "../spectre-api-client";
import { apiAddress } from "../addresses";

const CPUStats = () => {
  const [cpus, setCpus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [networkInfo, setNetworkInfo] = useState({
    blockreward: 0,
    networkHashrate: 0,
  });

  const { price } = useContext(PriceContext); // get price from PriceContext

  useEffect(() => {
    const fetchCpuData = async () => {
      try {
        const response = await fetch("/hashrate-data.json");
        const cpuData = await response.json();
        setCpus(cpuData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching CPU data:", error);
      }
    };

    const fetchNetworkInfo = async () => {
      try {
        const dag_info = await getBlockdagInfo();
        const networkHashrate = ((dag_info.difficulty * 2) / 1_000_000).toFixed(
          2,
        ); // nethash; in MH/s

        const blockRewardResponse = await fetch(
          `https://${apiAddress}/info/blockreward`,
        );
        const blockRewardData = await blockRewardResponse.json();

        setNetworkInfo({
          blockreward: blockRewardData.blockreward || 0, // blockreward from the API response
          networkHashrate: networkHashrate, // network hashrate
        });
      } catch (error) {
        console.error("Error fetching network info:", error);
      }
    };

    fetchCpuData();
    fetchNetworkInfo();
  }, []);

  // calculate profitability using KHs
  const calculateProfitability = (cpuHashrateKhs) => {
    const { blockreward, networkHashrate } = networkInfo;
    const ownHashrateThs = cpuHashrateKhs / 1_000; // convert to MH/s
    const percentOfNetwork = ownHashrateThs / parseFloat(networkHashrate);
    const totalSprPerDay = 86400 * blockreward; // ~86400 blocks per day
    const sprPerDay = totalSprPerDay * percentOfNetwork;
    const usdtPerDay = sprPerDay * price; // price from PriceContext

    return { sprPerDay, usdtPerDay };
  };

  // ref profitability for 1 KH/s, 10 KH/s, and 100 KH/s
  const referenceValues = [
    { khs: 1, label: "1 KH/s" },
    { khs: 10, label: "10 KH/s" },
    { khs: 100, label: "100 KH/s" },
  ];

  const referenceProfitability = referenceValues.map((ref) => {
    const profitability = calculateProfitability(ref.khs);
    return {
      ...ref,
      sprPerDay: profitability.sprPerDay.toFixed(2),
      usdtPerDay: profitability.usdtPerDay.toFixed(2),
    };
  });

  // sorting
  const sortedCpus = [...cpus].sort((a, b) => {
    if (sortConfig.key === null) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (
      [
        "KHs",
        "Cores",
        "Threads",
        "RAM_size",
        "RAM_frequency",
        "Power_Reported",
        "Power_at_wall",
      ].includes(sortConfig.key)
    ) {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;

      return sortConfig.direction === "ascending"
        ? aValue - bValue
        : bValue - aValue;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "ascending"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  // sorting by column
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="cpu-stats-page">
      <Container className="webpage px-md-5 blocks-page-overview" fluid>
        <div className="block-overview mb-4">
          <div className="d-flex flex-row w-100">
            <h4 className="block-overview-header text-center w-100 mt-4">
              CPU Hashrates
            </h4>
          </div>

          {/* ref values for 1 KH/s, 10 KH/s, and 100 KH/s */}
          <div className="mb-4">
            <div>
              {referenceProfitability.map((ref, index) => (
                <div key={index}>
                  {ref.label}: {ref.sprPerDay} SPR/day, {ref.usdtPerDay}{" "}
                  USDT/day
                </div>
              ))}
            </div>
          </div>

          <div className="block-overview-content">
            {loading ? (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : (
              <>
                <table className="styled-table w-100 mb-4">
                  <thead>
                    <tr>
                      <th onClick={() => requestSort("Miner")}>Miner</th>
                      <th onClick={() => requestSort("KHs")}>KH/s</th>
                      <th onClick={() => requestSort("Brand")}>Brand</th>
                      <th onClick={() => requestSort("Model")}>Model</th>
                      <th onClick={() => requestSort("Cores")}>Cores</th>
                      <th onClick={() => requestSort("Threads")}>Threads</th>
                      <th>SPR/day</th>
                      <th>USDT/day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCpus.map((cpu, index) => {
                      const profitability = calculateProfitability(cpu.KHs);
                      return (
                        <tr key={index}>
                          <td className="cpustats">{cpu.Miner}</td>
                          <td className="cpustats">{cpu.KHs}</td>
                          <td className="cpustats">{cpu.Brand}</td>
                          <td className="cpustats">{cpu.Model}</td>
                          <td className="cpustats">{cpu.Cores}</td>
                          <td className="cpustats">{cpu.Threads}</td>
                          <td className="cpustats">
                            {profitability.sprPerDay.toFixed(2)}
                          </td>
                          <td className="cpustats">
                            {profitability.usdtPerDay.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CPUStats;

import { faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import { useEffect, useState } from "react";
import { numberWithCommas } from "../helper";
import { getCoinSupply, getHalving } from "../spectre-api-client";
import { apiAddress } from "../addresses";

const CBox = () => {
  const [circCoins, setCircCoins] = useState("-");
  const [blockReward, setBlockReward] = useState("-");
  const [halvingDate, setHalvingDate] = useState("-");
  const [halvingAmount, setHalvingAmount] = useState("-");

  useEffect(() => {
    const initBox = async () => {
      const coinSupplyResp = await getCoinSupply();
      getBlockReward();

      getHalving().then((d) => {
        setHalvingDate(
          moment(d.nextHalvingTimestamp * 1000).format("YYYY-MM-DD HH:mm"),
        );
        setHalvingAmount(d.nextHalvingAmount.toFixed(2));
      });

      setCircCoins(Math.round(coinSupplyResp.circulatingSupply / 100000000));
    };

    initBox();

    const updateCircCoins = setInterval(async () => {
      const coinSupplyResp = await getCoinSupply();
      setCircCoins(Math.round(coinSupplyResp.circulatingSupply / 100000000));
    }, 10000);

    return () => {
      clearInterval(updateCircCoins);
    };
  }, []);

  async function getBlockReward() {
    await fetch(`https://${apiAddress}/info/blockreward`)
      .then((response) => response.json())
      .then((d) => {
        setBlockReward(d.blockreward.toFixed(2));
      })
      .catch((err) => console.log("Error", err));
  }

  useEffect(() => {
    document.getElementById("coins").animate(
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
  }, [circCoins]);

  return (
    <div className="cardBox mx-0">
      <table style={{ fontSize: "1rem" }}>
        <tr>
          <td colSpan="2" className="text-center" style={{ fontSize: "4rem" }}>
            <FontAwesomeIcon icon={faCoins} />
            <div id="light1" className="cardLight" />
          </td>
        </tr>
        <tr>
          <td colSpan="2" className="text-center">
            <h3>Coin supply</h3>
          </td>
        </tr>
        <tr>
          <td className="cardBoxElement align-top">Total</td>
          <td>
            <div id="coins">{numberWithCommas(circCoins)} SPR</div>
          </td>
        </tr>
        <tr>
          <td className="cardBoxElement align-top">
            Max <span className="approx">(approx.)</span>
          </td>
          <td className="pt-1">1,161,000,000 SPR</td>
        </tr>
        <tr>
          <td className="cardBoxElement align-top">Mined</td>
          <td className="pt-1">
            {((circCoins / 1161000000) * 100).toFixed(2)} %
          </td>
        </tr>
        <tr>
          <td className="cardBoxElement align-top">Block reward</td>
          <td className="pt-1">{blockReward} SPR</td>
        </tr>
        <tr>
          <td className="cardBoxElement align-top">Reward reduction</td>
          <td className="pt-1">
            {halvingDate}
            <br />
            <div
              className="text-end w-100 pe-3 pt-1"
              style={{ fontSize: "small" }}
            >
              to {halvingAmount} SPR
            </div>
          </td>
        </tr>
      </table>
    </div>
  );
};

export default CBox;

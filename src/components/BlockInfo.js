/* global BigInt */

import moment from "moment";
import { useContext, useEffect, useRef, useState, useMemo } from "react";
import {
  Col,
  Container,
  OverlayTrigger,
  Row,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import { parsePayload } from "../bech32.js";
import { numberWithCommas } from "../helper.js";
import { getBlock, getTransactions } from "../spectre-api-client.js";
import BlueScoreContext from "./BlueScoreContext.js";
import CopyButton from "./CopyButton.js";
import NotAcceptedTooltip from "./NotAccepted.js";
import PriceContext from "./PriceContext.js";
import { Network } from "vis-network/standalone";

const BlockLamp = (props) => {
  return (
    <OverlayTrigger
      overlay={
        <Tooltip>It is a {props.isBlue ? "blue" : "red"} block!</Tooltip>
      }
    >
      <div className={`ms-3 block-lamp-${props.isBlue ? "blue" : "red"}`} />
    </OverlayTrigger>
  );
};

const getAddrFromOutputs = (outputs, i) => {
  for (const o of outputs) {
    if (o.index === i) {
      return o.script_public_key_address;
    }
  }
};
const getAmountFromOutputs = (outputs, i) => {
  for (const o of outputs) {
    if (o.index === i) {
      return o.amount / 100000000;
    }
  }
};

// Parents derive their colors from their inclusion in the blue or red merge sets of the current block.
// if a parent's hash is present in `mergeSetBluesHashes` of the current block, it is assigned a blue color.
// if the parent's hash is found in `mergeSetRedsHashes`, it is assigned a red color.

// Children are represented visually without a defined color. (currently)
// (TODO: expanding our getBlock endpoint to include `GetCurrentBlockColor` rpc to determine blocks color?)

// current block's color is determined by `isBlueBlock` which is passed to the `BlockLamp` component
// `isBlueBlock` flag queryies the block's children and checking if the current block's hash is present in their `mergeSetBluesHashes`
// if found, `isBlueBlock` is set to `true` and the block is rendered blue; otherwise, defaults to `false` (red)

// create nodes for DAG graph
const createNodes = (blocks, currentBlock, isBlueBlock) => {
  return blocks.map((block) => ({
    id: block.id,
    label: `${block.id.slice(0, 4)}\n${block.id.slice(4, 8)}`, // 4x4
    shape: "box",
    color: {
      background: block.isCurrentBlock
        ? isBlueBlock
          ? "#bfe6ff" // blue for cblock if isBlueBlock is true
          : "#ff005a" // red for cblock if isBlueBlock is false
        : currentBlock?.verboseData?.mergeSetBluesHashes?.includes(block.id)
          ? "#bfe6ff" // blue for parents in blue merge set
          : currentBlock?.verboseData?.mergeSetRedsHashes?.includes(block.id)
            ? "#ff005a" // red for parents in red merge set
            : block.isParent
              ? "#d3d3d3" // default gray for other parents (if not in merge sets)
              : "#ffffff", // white for children or other blocks
      border: "#000",
    },
  }));
};

// create edges for DAG graph
const createEdges = (blocks) => {
  return blocks.flatMap((block) => {
    // edges for parents
    const parentEdges = block.parents
      ? block.parents
          .filter((parentId) => blocks.some((b) => b.id === parentId))
          .map((parentId) => ({
            from: parentId,
            to: block.id,
            arrows: "from",
            color: "#4cc9f0", // parent connections
          }))
      : [];

    // edges for children
    const childEdges = block.childrenHashes
      ? block.childrenHashes
          .filter((childId) => blocks.some((b) => b.id === childId))
          .map((childId) => ({
            from: block.id,
            to: childId,
            arrows: "from",
            color: "#808080", // child connections
          }))
      : [];

    return [...parentEdges, ...childEdges];
  });
};

const BlockInfo = () => {
  const { id } = useParams();
  const { blueScore } = useContext(BlueScoreContext);
  const [blockInfo, setBlockInfo] = useState();
  const [txInfo, setTxInfo] = useState();
  const [minerName, setMinerName] = useState();
  const [minerAddress, setMinerAddress] = useState();
  const [isBlueBlock, setIsBlueBlock] = useState(null);
  const [error, setError] = useState(false);
  const { price } = useContext(PriceContext);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setError(false);
    getBlock(id)
      .then((res) => {
        setBlockInfo(res);
      })
      .catch(() => {
        setError(true);
        setBlockInfo(null);
      });
  }, [id]);

  useEffect(() => {
    setIsBlueBlock(null);
    if (!!blockInfo) {
      async function isBlueBlock(startBlocks) {
        var childListGlob = startBlocks;

        while (childListGlob.length > 0) {
          const hash = childListGlob.shift();
          const block = await getBlock(hash);
          if (block?.verboseData?.isChainBlock) {
            return block.verboseData.mergeSetBluesHashes?.includes(
              blockInfo?.verboseData?.hash,
            );
          } else {
            // console.log("PUSH", block.verboseData.childrenHashes)
            childListGlob.push(...(block?.verboseData?.childrenHashes || []));
          }
        }
      }

      isBlueBlock([...(blockInfo?.verboseData?.childrenHashes || [])])
        .then((res) => setIsBlueBlock(res))
        .catch((err) => console.log("ERROR", err));

      let [address, miner] = ["No miner info", "No miner info"];

      if (blockInfo?.transactions?.[0]?.payload) {
        [address, miner] = parsePayload(blockInfo.transactions[0].payload);
      }

      // request TX input addresses
      const txToQuery = blockInfo.transactions
        .flatMap((tx) =>
          tx.inputs?.flatMap(
            (txInput) => txInput.previousOutpoint.transactionId,
          ),
        )
        .filter((x) => x)
        .concat(
          blockInfo.transactions.map((tx) => tx.verboseData.transactionId),
        );

      getTransactions(txToQuery, true, true)
        .then((resp) => {
          const respAsObj = resp.reduce((obj, cur) => {
            obj[cur["transaction_id"]] = cur;
            return obj;
          }, {});
          console.log(respAsObj);
          setTxInfo(respAsObj);
        })
        .catch((err) => console.log("Error ", err));

      setMinerName(miner);
      setMinerAddress(address);
    }
  }, [blockInfo]);

  // DAG data for graph visualization
  const dagData = useMemo(() => {
    if (!blockInfo) return [];

    return [
      {
        id: blockInfo.verboseData.hash,
        isCurrentBlock: true,
        parents: blockInfo.header?.parents?.[0]?.parentHashes || [],
        childrenHashes: blockInfo.verboseData.childrenHashes || [],
      },
      ...(blockInfo.header?.parents?.[0]?.parentHashes || []).map(
        (parentId) => ({
          id: parentId,
          isParent: true,
        }),
      ),
      ...(blockInfo.verboseData.childrenHashes || []).map((childId) => ({
        id: childId,
        isChild: true,
      })),
    ];
  }, [blockInfo]);

  // static DAG graph
  useEffect(() => {
    if (dagData.length > 0 && containerRef.current) {
      const nodes = createNodes(dagData, blockInfo, isBlueBlock); // pass isBlueBlock state here
      const edges = createEdges(dagData);

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
        },
        physics: {
          enabled: false, // prevent movement
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
          color: "#000000",
          arrows: { to: { enabled: true, type: "arrow" } },
          width: 2,
          smooth: {
            type: "cubicBezier",
            forceDirection: "horizontal",
            roundness: 0.5,
          },
        },
      };

      const network = new Network(containerRef.current, dataSet, options);

      network.on("click", (params) => {
        if (params.nodes.length > 0) {
          const blockHash = params.nodes[0];
          navigate(`/blocks/${blockHash}`);
        }
      });
    }
  }, [dagData, isBlueBlock, blockInfo, navigate]);

  return (
    <div className="blockinfo-page">
      <Container className="webpage" fluid>
        <Row>
          <Col className="mx-0">
            {error ? <h1 variant="danger">Error loading block</h1> : <></>}

            {!!blockInfo ? (
              <div className="blockinfo-content">
                <div className="blockinfo-header">
                  <h4 className="d-flex flex-row align-items-center">
                    block details{" "}
                    {isBlueBlock === null ? (
                      <Spinner className="ms-3" animation="grow" />
                    ) : (
                      <BlockLamp isBlue={isBlueBlock} />
                    )}
                  </h4>
                </div>
                {/* <font className="blockinfo-header-id">{id.substring(0, 20)}...</font> */}
                <Container className="blockinfo-table mx-0" fluid>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Hash
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      {blockInfo.verboseData.hash}
                      <CopyButton text={blockInfo.verboseData.hash} />
                    </Col>
                    {/* {isBlue ? "BLUE" : "RED"} */}
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Blue Score
                    </Col>
                    <Col className="blockinfo-value" lg={10}>
                      {blockInfo.header.blueScore}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Bits
                    </Col>
                    <Col className="blockinfo-value" lg={10}>
                      {blockInfo.header.bits}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Timestamp
                    </Col>
                    <Col className="blockinfo-value" lg={10}>
                      {moment(parseInt(blockInfo.header.timestamp)).format(
                        "YYYY-MM-DD HH:mm:ss",
                      )}{" "}
                      ({blockInfo.header.timestamp})
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Version
                    </Col>
                    <Col className="blockinfo-value" lg={10}>
                      {blockInfo.header.version}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Is Chain Block
                    </Col>
                    <Col className="blockinfo-value" lg={10}>
                      {!!blockInfo.verboseData.isChainBlock ? "true" : "false"}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Parents
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      <ul>
                        {blockInfo.header.parents[0].parentHashes.map((x) => (
                          <li>
                            <Link
                              className="blockinfo-link"
                              to={`/blocks/${x}`}
                            >
                              {x}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Children
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      <ul>
                        {(blockInfo.verboseData.childrenHashes || []).map(
                          (child) => (
                            <li>
                              <Link
                                className="blockinfo-link"
                                to={`/blocks/${child}`}
                              >
                                {child}
                              </Link>
                            </li>
                          ),
                        )}
                      </ul>
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col lg={12}>
                      <div ref={containerRef} style={{ height: "300px" }} />
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Merkle Root
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      {blockInfo.header.hashMerkleRoot}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Accepted Merkle Root
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      {blockInfo.header.acceptedIdMerkleRoot}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      UTXO Commitment
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      {blockInfo.header.utxoCommitment}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Nonce
                    </Col>
                    <Col className="blockinfo-value" lg={10}>
                      {blockInfo.header.nonce}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      DAA Score
                    </Col>
                    <Col className="blockinfo-value" lg={10}>
                      {blockInfo.header.daaScore}
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Blue Work
                    </Col>
                    <Col className="blockinfo-value" lg={10}>
                      {blockInfo.header.blueWork} (
                      {BigInt(`0x${blockInfo.header.blueWork}`).toString()})
                    </Col>
                  </Row>
                  <Row className="blockinfo-row">
                    <Col className="blockinfo-key" lg={2}>
                      Pruning Point
                    </Col>
                    <Col className="blockinfo-value-mono" lg={10}>
                      <Link
                        className="blockinfo-link"
                        to={`/blocks/${blockInfo.header.pruningPoint}`}
                      >
                        {blockInfo.header.pruningPoint}
                      </Link>
                    </Col>
                  </Row>
                  <Row className="blockinfo-row border-bottom-0">
                    <Col className="blockinfo-key" lg={2}>
                      Miner Info
                    </Col>
                    <Col className="blockinfo-value-mono md-3" lg={10}>
                      <div className="blockinfo-value">{minerName}</div>
                      <div>
                        <Link
                          className="blockinfo-link"
                          to={`/addresses/${minerAddress}`}
                        >
                          {minerAddress}
                        </Link>
                      </div>
                    </Col>
                  </Row>
                </Container>
              </div>
            ) : (
              <></>
            )}
          </Col>
        </Row>

        <Row>
          <Col>
            {!!blockInfo ? (
              <div className="blockinfo-content mt-4 mb-5">
                <div className="blockinfo-header">
                  <h4>Transactions</h4>
                </div>
                <Container className="webpage utxo-box" fluid>
                  {(blockInfo.transactions || []).map((tx, tx_index) => (
                    <>
                      <Row className="utxo-border py-3">
                        <Col sm={12} md={12} lg={12}>
                          <div className="utxo-header">transaction id</div>
                          <div className="utxo-value-mono">
                            <Link
                              to={`/txs/${tx.verboseData.transactionId}`}
                              className="blockinfo-link"
                            >
                              {tx.verboseData.transactionId}
                            </Link>
                            <CopyButton text={tx.verboseData.transactionId} />
                          </div>

                          <Col sm={12} md={12}>
                            <div className="utxo-header mt-3">FROM</div>
                            <Container className="utxo-value-mono" fluid>
                              {(tx.inputs || []).map((txInput, index) => (
                                <Row key={index}>
                                  {!!txInfo &&
                                  txInfo[
                                    txInput.previousOutpoint.transactionId
                                  ] ? (
                                    <>
                                      <Col
                                        xs={12}
                                        sm={8}
                                        md={9}
                                        lg={9}
                                        xl={8}
                                        xxl={7}
                                        className="text-truncate"
                                      >
                                        <Link
                                          to={`/addresses/${getAddrFromOutputs(txInfo[txInput.previousOutpoint.transactionId]["outputs"], txInput.previousOutpoint.index || 0)}`}
                                          className="blockinfo-link"
                                        >
                                          {getAddrFromOutputs(
                                            txInfo[
                                              txInput.previousOutpoint
                                                .transactionId
                                            ]["outputs"],
                                            txInput.previousOutpoint.index || 0,
                                          )}
                                        </Link>
                                        <CopyButton
                                          text={getAddrFromOutputs(
                                            txInfo[
                                              txInput.previousOutpoint
                                                .transactionId
                                            ]["outputs"],
                                            txInput.previousOutpoint.index || 0,
                                          )}
                                        />
                                      </Col>
                                      <Col
                                        className="block-utxo-amount-minus"
                                        xs={12}
                                        sm={4}
                                        md={2}
                                      >
                                        -
                                        {numberWithCommas(
                                          getAmountFromOutputs(
                                            txInfo[
                                              txInput.previousOutpoint
                                                .transactionId
                                            ]["outputs"],
                                            txInput.previousOutpoint.index || 0,
                                          ),
                                        )}
                                        &nbsp;SPR
                                      </Col>
                                    </>
                                  ) : (
                                    <>
                                      <Col
                                        xs={12}
                                        sm={8}
                                        md={9}
                                        lg={9}
                                        xl={8}
                                        xxl={7}
                                        className="text-truncate"
                                      >
                                        <a
                                          className="blockinfo-link"
                                          href={`/txs/${txInput.previousOutpoint.transactionId}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          TX #
                                          {txInput.previousOutpoint.index || 0}{" "}
                                          {
                                            txInput.previousOutpoint
                                              .transactionId
                                          }
                                        </a>
                                      </Col>
                                      <Col
                                        className="me-auto"
                                        xs={12}
                                        sm={4}
                                        md={2}
                                      ></Col>
                                    </>
                                  )}
                                </Row>
                              ))}
                              {!tx.inputs ? (
                                <Row>
                                  <Col
                                    xs={12}
                                    sm={8}
                                    md="auto"
                                    className="text-truncate"
                                  >
                                    COINBASE (New coins)
                                  </Col>
                                </Row>
                              ) : null}
                            </Container>
                          </Col>

                          <Col sm={12} md={12}>
                            <div className="utxo-header mt-1">TO</div>
                            <Container className="utxo-value-mono" fluid>
                              {(tx.outputs || []).map((txOutput) => (
                                <Row>
                                  <Col
                                    xs={12}
                                    sm={8}
                                    md={9}
                                    lg={9}
                                    xl={8}
                                    xxl={7}
                                    className="text-truncate"
                                  >
                                    <Link
                                      to={`/addresses/${txOutput.verboseData.scriptPublicKeyAddress}`}
                                      className="blockinfo-link"
                                    >
                                      {
                                        txOutput.verboseData
                                          .scriptPublicKeyAddress
                                      }
                                    </Link>

                                    <CopyButton
                                      text={
                                        txOutput.verboseData
                                          .scriptPublicKeyAddress
                                      }
                                    />
                                  </Col>
                                  <Col
                                    className="block-utxo-amount"
                                    xs={12}
                                    sm={4}
                                    md={3}
                                  >
                                    +
                                    {numberWithCommas(
                                      txOutput.amount / 100000000,
                                    )}
                                    &nbsp;SPR
                                  </Col>
                                </Row>
                              ))}
                            </Container>
                          </Col>
                        </Col>
                        <Col sm={5} md={4}>
                          <div className="utxo-header mt-3">tx amount</div>
                          <div className="utxo-value d-flex flex-row">
                            <div className="utxo-amount">
                              {numberWithCommas(
                                tx.outputs.reduce(
                                  (a, b) => (a || 0) + parseInt(b.amount),
                                  0,
                                ) / 100000000,
                              )}{" "}
                              SPR
                            </div>
                          </div>
                        </Col>
                        <Col sm={3} md={2}>
                          <div className="utxo-header mt-3">tx value</div>
                          <div className="utxo-value">
                            {(
                              (tx.outputs.reduce(
                                (a, b) => (a || 0) + parseInt(b.amount),
                                0,
                              ) /
                                100000000) *
                              price
                            ).toFixed(2)}{" "}
                            $
                          </div>
                        </Col>
                        <Col sm={4} md={6}>
                          <div className="utxo-header mt-3">details</div>
                          <div className="utxo-value d-flex flex-row flex-wrap">
                            {!!txInfo &&
                            txInfo[tx.verboseData.transactionId] ? (
                              txInfo[tx.verboseData.transactionId]
                                ?.is_accepted ? (
                                <div className="accepted-true mb-3 me-3">
                                  accepted
                                </div>
                              ) : (
                                <>
                                  <span className="accepted-false">
                                    not accepted
                                  </span>
                                  <NotAcceptedTooltip />
                                </>
                              )
                            ) : (
                              <>-</>
                            )}
                            {!!txInfo &&
                              !!txInfo[tx.verboseData.transactionId]
                                ?.is_accepted &&
                              blueScore !== 0 &&
                              blueScore -
                                txInfo[tx.verboseData.transactionId]
                                  .accepting_block_blue_score <
                                86400 && (
                                <div className="confirmations mb-3">
                                  {blueScore -
                                    txInfo[tx.verboseData.transactionId]
                                      .accepting_block_blue_score}
                                  &nbsp;confirmations
                                </div>
                              )}
                            {!!txInfo &&
                              !!txInfo[tx.verboseData.transactionId]
                                ?.is_accepted &&
                              blueScore !== 0 &&
                              blueScore -
                                txInfo[tx.verboseData.transactionId]
                                  .accepting_block_blue_score >=
                                86400 && (
                                <div className="confirmations mb-3">
                                  finalized
                                </div>
                              )}
                          </div>
                        </Col>
                      </Row>
                    </>
                  ))}
                </Container>
              </div>
            ) : (
              <></>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default BlockInfo;

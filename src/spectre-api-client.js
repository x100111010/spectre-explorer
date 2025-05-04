import { apiAddress, nodeData } from "./constants";

export async function getBlock(hash) {
  const res = await fetch(`https://${apiAddress}/blocks/${hash}`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getTransaction(hash, blockHash) {
  const queryParams = blockHash ? `?blockHash=${blockHash}` : "";
  const res = await fetch(
    `https://${apiAddress}/transactions/${hash}${queryParams}`,
    {
      headers: { "Access-Control-Allow-Origin": "*" },
    },
  )
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getBlockdagInfo() {
  const res = await fetch(`https://${apiAddress}/info/blockdag`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getSpectredInfo() {
  const res = await fetch(`https://${apiAddress}/info/spectred`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getFeeEstimate() {
  const res = await fetch(`https://${apiAddress}/info/fee-estimate`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getHashrateMax() {
  const res = await fetch(`https://${apiAddress}/info/hashrate/max`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getCoinSupply() {
  const res = await fetch(`https://${apiAddress}/info/coinsupply`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getAddressBalance(addr) {
  const res = await fetch(`https://${apiAddress}/addresses/${addr}/balance`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((response) => response.json())
    .then((data) => {
      return data.balance;
    });
  return res;
}

export async function getAddressTxCount(addr) {
  const res = await fetch(
    `https://${apiAddress}/addresses/${addr}/transactions-count`,
    { headers: { "Access-Control-Allow-Origin": "*" } },
  )
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getAddressUtxos(addr) {
  const res = await fetch(`https://${apiAddress}/addresses/${addr}/utxos`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getHalving() {
  const res = await fetch(`https://${apiAddress}/info/halving`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getTransactionsFromAddress(addr, limit = 20, offset = 0) {
  const res = await fetch(
    `https://${apiAddress}/addresses/${addr}/full-transactions?limit=${limit}&offset=${offset}`,
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "content-type": "application/json",
      },
      method: "GET",
    },
  )
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getTransactions(tx_list, inputs, outputs) {
  const res = await fetch(`https://${apiAddress}/transactions/search`, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ transactionIds: tx_list }),
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

export async function getNodes() {
  const res = await fetch(`https://${nodeData}/nodes`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
  return res;
}

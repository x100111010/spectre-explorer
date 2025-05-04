let API_SERVER = process.env.REACT_APP_API_SERVER || "";
let SOCKET_SERVER = process.env.WS_SERVER || "";
let SUFFIX = "";
let ADDRESS_PREFIX = "spectre:";
let NODE_LOC_API =
  process.env.NODE_LOC_API || "https://api.nodes.mainnet.spectre-network.xyz";

let BPS = 1;

switch (process.env.REACT_APP_NETWORK) {
  case "testnet-10":
    SOCKET_SERVER = "wss://api-tn.spectre-network.org";
    if (!API_SERVER) {
      API_SERVER = "https://api-tn.spectre-network.org";
      ADDRESS_PREFIX = "spectretest:";
    }
    SUFFIX = " TN10";
    // BPS = 10
    break;

  // mainnet
  default:
    SOCKET_SERVER = "wss://api.spectre-network.org";
    if (!API_SERVER) {
      API_SERVER = "https://api.spectre-network.org";
      ADDRESS_PREFIX = "spectre:";
    }
    break;
}

export { SOCKET_SERVER, SUFFIX, API_SERVER, ADDRESS_PREFIX, NODE_LOC_API, BPS };

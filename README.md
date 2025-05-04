# Spectre Explorer

[![Lint Check](https://github.com/spectre-project/spectre-explorer/actions/workflows/lint.yml/badge.svg)](https://github.com/spectre-project/spectre-explorer/actions/workflows/lint.yml)
[![LICENSE](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/spectre-project/spectre-explorer/blob/main/LICENSE)

This is a fork of Kaspa explorer used for the Spectre network project
[https://explorer.spectre-network.org](https://explorer.spectre-network.org)
written in JS with React.JS library.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Features

- **DAG Visualization with `vis-network`:**  
  Provides an interactive representation of the Spectre block DAG structure, displaying parent-child relationships, block classifications and block progression.

---

### Node Colors

- **Red Nodes:** Represent blocks classified as red. These are blocks whose merge sets contain too many blocks to qualify as blue, often associated with attacker blocks.
- **Blue Nodes:** Represent blocks classified as blue. These are blocks considered honest and part of the GHOSTDAG consensus.
- **Non-Chained Blocks:** Represent blocks not included in the GHOSTDAG-selected chain but still part of the DAG structure.
- **Chained Blocks:** Represent blocks included in the GHOSTDAG-selected chain, which includes the Selected Parent Chain (SPC).

### Edge Colors

- **Red Blocks:** Have red edges to indicate their relationship with parents and use a red background for their nodes.
- **Non-Chained Blocks:** Use grey edges to distinguish them from consensus-related (chained) blocks.

### Arrow Direction and Layout

- **Arrows point from child to parent:**  
  Each block references its parents with arrows.
  - **Rightward:** Younger generations of blocks, with the rightmost blocks being the DAG's tips (newest blocks).
  - **Leftward:** Older generations of blocks, ending at the genesis (the origin of the DAG).

---

## Deployment

For deploying the block explorer make sure that nodejs build
environment is set up by running `npm --version`. The build requires
to configure the following mandatory environment variables:

- `REACT_APP_API_ADDRESS`: This is the public address of the REST API endpoint.

The API endpoint must be hosted on a web server secured with SSL.

You can configure the API endpoint by setting `REACT_APP_API_ADDRESS` to one of the following:

- `api.spectre-network.org` (Mainnet)
- `api-tn.spectre-network.org` (Testnet-10)
- `api-tn11.spectre-network.org` (Testnet-11)

Optionally you can specify the explorer version to show in the
footer:

- `REACT_APP_VERCEL_GIT_COMMIT_SHA` which is the version of
  the running explorer instance (default: xxxxxx).

- `REACT_APP_BPS` Sets the blocks per
  second value for the explorer (default is 1).

Set constants

```
export NETWORK=testnet-10
```

Build the block explorer:

```
git clone https://github.com/spectre-project/spectre-explorer
cd spectre-explorer
npm install
```

Start the block explorer:

```
node server.js
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Development Fund

The devfund is a fund managed by the Spectre community in order to fund Spectre development. Please consider a donation to support ongoing and future projects.

```
spectre:qrxf48dgrdkjxllxczek3uweuldtan9nanzjsavk0ak9ynwn0zsayjjh7upez
```

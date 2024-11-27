# Spectre Explorer

[![Lint Check](https://github.com/spectre-project/spectre-explorer/actions/workflows/lint.yml/badge.svg)](https://github.com/spectre-project/spectre-explorer/actions/workflows/lint.yml)
[![LICENSE](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/spectre-project/spectre-explorer/blob/main/LICENSE)

This is a fork of Kaspa explorer used for the Spectre network project
[https://explorer.spectre-network.org](https://explorer.spectre-network.org)
written in JS with React.JS library.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Features

- Introduced DAG visualization using `vis-network`:

  - Blocks/Nodes are color-coded:

    - White ⚪: for blocks that are part of the Selected Parent Chain (SPC). These blocks are directly linked to their selected parents, eventually tracing back to the genesis block. They are considered part of the main consensus path in the DAG.
    - Red 🔴: for blocks that are not part of the Selected Parent Chain (non-chained blocks). These blocks are valid within the DAG but do not belong to the SPC. They exist as alternative chains within the DAG, contributing to the structure but not directly influencing the main consensus path.

  - Parent-child relationships between blocks are shown using edges (lines/arrows🏹 connecting blocks). These edges help visualize how blocks are related within the DAG:

    - Blue 🔹: edges represent the relationship between a block and its blue merge set parent, which indicates that the block is part of the main blue chain in the DAG. This main chain includes both chained and non-chained blocks, all of which are considered honest and relevant to the consensus.
    - Red 🔺: edges represent the connection between a block and its red merge set parent, which are blocks outside the main blue chain. These blocks are typically viewed as potential "attacker" blocks or blocks not part of the consensus, but they are still valid within the DAG. Red blocks are rare and do not influence the consensus chain directly.

  - Clicking a block redirects to the BlockInfo page, which now also includes a static DAG graph

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
export REACT_APP_VERCEL_GIT_COMMIT_SHA="$(git log -1 --date=short --format="%h" | tr -d '-')"
export REACT_APP_API_ADDRESS=api.spectre-network.org
export REACT_APP_NODE_DATA=api.nodes.mainnet.spectre-network.xyz
export REACT_APP_BPS=1
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

# Spectre Explorer

[![Lint Check](https://github.com/spectre-project/spectre-explorer/actions/workflows/lint.yml/badge.svg)](https://github.com/spectre-project/spectre-explorer/actions/workflows/lint.yml)
[![LICENSE](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/spectre-project/spectre-explorer/blob/main/LICENSE)

This is a fork of Kaspa explorer used for the Spectre network project
[https://explorer.spectre-network.org](https://explorer.spectre-network.org)
written in JS with React.JS library.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Deployment

For deploying the block explorer make sure that nodejs build
environment is set up by running `npm --version`. The build requires
to configure the following mandatory environment variables:

- `REACT_APP_API_ADDRESS` which is the public address of the
  REST API endpoint.

The API endpoint and Graph Inspector must operate on a web server
secured with SSL.

Optionally you can specify the explorer version to show in the
footer:

- `REACT_APP_VERCEL_GIT_COMMIT_SHA` which is the version of
  the running explorer instance (default: xxxxxx).

Build the block explorer:

```
git clone https://github.com/spectre-project/spectre-explorer
cd spectre-explorer
export REACT_APP_VERCEL_GIT_COMMIT_SHA="$(git log -1 --date=short --format="%h" | tr -d '-')"
export REACT_APP_API_ADDRESS=api.spectre-network.org
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

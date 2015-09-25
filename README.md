# Chrome Extension

Streamable chrome extension for easy uploading from multiple platforms

## Setup

Install dependencies with `npm install`.

## Developing

Load the src directory as an unpacked extension in [chrome://extensions](chrome://extensions).

Run `make lint` to check code for issues.

## Distributing

Run `make` to generate a build of the extension.

To update the list of supported sites, update the patterns in sites.patterns.json and then run `make deploy-sites`.

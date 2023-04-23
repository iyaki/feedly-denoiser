#!/bin/env bash

cd "$(dirname "$(realpath "$0")")" || exit

if [ -f .env ]; then
    . .env
fi

export CLIENT_ID
export CLIENT_SECRET
export COLLECTION

node index.js

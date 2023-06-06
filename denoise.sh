#!/bin/env bash

set -euo pipefail

if [ "$#" != 3 ]
then
		printf 'denoise.sh - filter feedly articles
Usage:
	denoise.sh path_to_blacklist.json path_to_whitelist.json path_to_blackestlist.json
'
exit
fi

_() {
	declare -a LIST_PATHS

	for arg in "$@"
	do
		LIST_PATHS+=("$(realpath "$arg")")
	done

	cd "$(dirname "$(realpath "$0")")" || exit

	if [ -f .env ]; then
			. .env
	fi

	export CLIENT_SECRET
	export COLLECTION

	node index.js "${LIST_PATHS[@]}"

} && _ "$@"
unset -f _

#!/bin/zsh
# Finder does not load your interactive shell, so restore the user's developer PATH.
cd -- "${0:A:h}" || exit 1
exec /bin/zsh -l -i -c 'node ./dev.mjs --open'

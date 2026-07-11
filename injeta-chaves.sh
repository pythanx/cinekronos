#!/bin/bash
echo "=== CRIANDO env-config.js ==="
echo "window._env_ = { APIKEY_TMDB: '${APIKEY_TMDB}', APIKEY_OMDB: '${APIKEY_OMDB}' };" > env-config.js
echo "=== ARQUIVO CRIADO ==="
cat env-config.js
#!/bin/bash
# Gera o arquivo env-config.js com as chaves que vem do GitHub Secrets
echo "window._env_ = { APIKEY_TMDB: '${APIKEY_TMDB}', APIKEY_OMDB: '${APIKEY_OMDB}' };" > env-config.js
#!/bin/bash
# Cria um arquivo temporário com as chaves injetadas pelo cofre do GitHub
echo "window._env_ = { APIKEY_TMDB: '${APIKEY_TMDB}', APIKEY_OMDB: '${APIKEY_OMDB}' };" > env-config.js

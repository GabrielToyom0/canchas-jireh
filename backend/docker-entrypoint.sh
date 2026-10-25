#!/bin/sh
# Aplica las migraciones pendientes y arranca el monolito.
set -e
echo "Aplicando migraciones…"
../node_modules/.bin/prisma migrate deploy
exec node dist/src/server.js

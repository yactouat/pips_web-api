#!/bin/bash

docker compose -f tests.docker-compose.yml up -d --remove-orphans
PGUSER=api PGPASSWORD=api PGDATABASE=api npm run migrate-db-dev
jest --clearCache 
NODE_ENV=development IS_TEST=1 PGUSER=api PGPASSWORD=api PGDATABASE=api JWT_SECRET="some-secret" jest --detectOpenHandles --runInBand --forceExit
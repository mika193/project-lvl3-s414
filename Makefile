install: install-deps install-flow-typed

develop:
	npx webpack-dev-server

install-deps:
	npm install

build:
	rm -rf dist
	NODE_ENV=production npx webpack

deploy:
	surge --domain mika193-rss.surge.sh

test:
	npm test

lint:
	npx eslint .

test-coverage:
	npm run test-coverage

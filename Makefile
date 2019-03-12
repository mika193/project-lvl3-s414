install: install-deps install-flow-typed

develop:
	npx webpack-dev-server

install-deps:
	npm install

build:
	rm -rf dist
	NODE_ENV=production npx webpack

deploy:
	surge

test:
	npm test

lint:
	npx eslint .

test-coverage:
	npm run test-coverage

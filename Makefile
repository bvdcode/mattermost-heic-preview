.PHONY: test build dist clean

test:
	cd webapp && npm test

build:
	cd webapp && npm run build

dist: build
	node scripts/bundle.cjs

clean:
	rm -rf dist public/heic webapp/dist

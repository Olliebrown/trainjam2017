.PHONY: dev build deploy test

BUILD_FILE = build.zip

all:
	npm run dev

test:
	npm run test

test-fix:
	node node_modules/standard/bin/cmd.js --fix

build:
	npm run production && zip -r $(BUILD_FILE) assets dist index.html

deploy:
	butler push $(BUILD_FILE) tfinch/GAME:web

clean:
	rm $(BUILD_FILE)

release: | test build deploy

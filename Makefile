clean:
	rm -Rf build

build: clean
	rake build

dist: build
	mkdir -p build/framersketch
	cp "Export to Framer.sketchplugin" build/framersketch
	cp src/run.js build/framersketch
	cp run.py build/framersketch
	cp bin/coscript build/framersketch
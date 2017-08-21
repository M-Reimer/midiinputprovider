# -*- Mode: Makefile -*-
#
# Makefile for MIDI Input Provider
#

.PHONY: xpi

xpi: clean
	zip -r9 midiinputprovider-trunk.xpi manifest.json \
                                    midiconnector.svg \
                                    backgroundscript.js \
                                    contentscript.js \
                                    requestmidiaccess.js \
                                    options.html \
                                    options.js

clean:
	rm -f midiinputprovider-trunk.xpi

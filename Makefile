# -*- Mode: Makefile -*-
#
# Makefile for MIDI Input Provider
#

FILES = manifest.json \
        midiconnector.svg \
        backgroundscript.js \
        contentscript.js \
        requestmidiaccess.js \
        native-app-missing.html \
        options.html \
        options.js

ADDON = midiinputprovider

VERSION = $(shell sed -n  's/^  "version": "\([^"]\+\).*/\1/p' manifest.json)

trunk: $(ADDON)-trunk.xpi

release: $(ADDON)-$(VERSION).xpi

%.xpi: $(FILES)
	@zip -9 - $^ > $@

clean:
	rm -f $(ADDON)-*.xpi

# Starts local debug session
run:
	web-ext run --bc

# -*- Mode: Makefile -*-
#
# Makefile for MIDI Input Provider
#

DESTDIR=

all:
	@echo "Usage:"
	@echo '  "make install" for global installation (requires root)'
	@echo '  "make userinstall" for installing for just your user'

install:
	install -D -m 755 midiinputprovider.pl $(DESTDIR)/usr/bin/midiinputprovider.pl
	install -D -m 644 midiinputprovider.json $(DESTDIR)/usr/lib/mozilla/native-messaging-hosts/midiinputprovider.json

userinstall:
	install -D -m 755 midiinputprovider.pl $(HOME)/.bin/midiinputprovider.pl
	install -D -m 644 midiinputprovider.json $(HOME)/.mozilla/native-messaging-hosts/midiinputprovider.json
	sed -ri 's#/usr/bin#$(HOME)/.bin#' ~/.mozilla/native-messaging-hosts/midiinputprovider.json

MIDI Input Provider
====================

Main repository: https://github.com/M-Reimer/midiinputprovider.

AMO: https://addons.mozilla.org/en-US/firefox/addon/midi-input-provider/

Hacking: Do a [temporary install](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

Building: [make](https://www.gnu.org/software/make/) xpi

The target of this addon is, as the name suggests, to provide MIDI input to websites like piano learning platforms. That's what I want to use it for. I just didn't want to use Chrome for this task. To make this possible, this Addon implements just as much of the [Web MIDI standard](http://webaudio.github.io/web-midi-api/) as required to hand over MIDI keyboards to websites.

If you need more, please don't waste your time with hacking for this Addon but have a closer look at this bug: [Bug 836897: Implement the WebMIDI API](https://bugzilla.mozilla.org/show_bug.cgi?id=836897).

This repository includes the required native application in the subdirectory "nativeapp". This native application is **Linux only!** and this is the only OS I directly support.

Feel free to create native applications for your OS, but please don't provide them as Pull-Request. Please host them in your own repository and create an issue with the link to your repository so I can link you.

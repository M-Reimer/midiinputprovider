This directory contains the so called "native application".

It was written in Perl and allows the Firefox addon to access local MIDI devices

It also contains a Makefile for easy installation on your system.

Installation
------------

To install just for your user type:

    make userinstall

To install for all users of the system (root required) type:

    make install

The "make install" command supports "DESTDIR", so you can use it for packaging.
/*
    Firefox addon "MIDI Input Provider"
    Copyright (C) 2019  Manuel Reimer <manuel.reimer@gmx.de>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// This ends up in page context named as "navigator.requestMIDIAccess"
// It is meant to wrap the "simple intermediate API" fron "contentscript.js"
// into a partial WebMIDI compatible implementation.
var REQUESTMIDIACCESS = function() {
  function MIDIAccess(aList) {
    this.inputs = new Map();
    this.outputs = new Map();
    this.onstatechange = false;
    this.sysexEnabled = false;
    if (aList) {
      for (var index = 0; index < aList.length; index++) {
        var entry = aList[index];
        this.inputs.set(entry.id, new MIDIInput(entry));
      }
    }
  };

  function MIDIInput(aListEntry) {
    Object.defineProperty(this, 'id', {get: () => {return aListEntry.id;}});
    this.manufacturer = "";
    this.name = aListEntry.name;
    this.type = "input";
    this.version = "";
    let state = "disconnected";
    Object.defineProperty(this, 'state', {get: () => {return state;}});
    let connection = "closed";
    Object.defineProperty(this, 'connection', {get: () => {return connection;}});
    this.open = function(){};
    this.close = function(){};

    // Define our device-internal message callback.
    // Runs over all listeners and forwards messages to them.
    let listeners = [];
    let MidiCallback = (aMIDI) => {
      listeners.forEach((listener) => {
        listener({
          currentTarget: "MIDIInput",
          data: aMIDI
        });
      });
    }

    // "addEventListener" API. Only supported message type: midimessage
    // It is only supported to pass proper functions as aListener (no strings)
    this.addEventListener = (aEvent, aListener) => {
      if (aEvent !== "midimessage")
        return;
      if (typeof aListener !== "function")
        return
      if (listeners.includes(aListener))
        return;

      listeners.push(aListener);

      // Bind our message callback if not already done.
      if (state == "disconnected") {
        state = "connected";
        connection = "open";
        window.MidiInputProvider.BindCallback(aListEntry.id, MidiCallback);
      }
    }

    // "removeEventListener" API. Goes with the above one and removes listeners
    this.removeEventListener = (aEvent, aListener) => {
      if (aEvent !== "midimessage")
        return;
      if (typeof aListener !== "function")
        return
      if (!listeners.includes(aListener))
        return;

      listeners.splice(listeners.indexOf(aListener), 1);
    }

    // "onmidimessage" API. Passed value is forwareded to the above functions
    let onmidimessage;
    Object.defineProperty(this, 'onmidimessage', {set: (aValue) => {
      if (onmidimessage)
        this.removeEventListener("midimessage", onmidimessage);
      this.addEventListener("midimessage", aValue);
      onmidimessage = aValue;
    }});
  }

  return new Promise(function(resolve, reject) {
    window.MidiInputProvider.Init(function() {
      window.MidiInputProvider.GetList(function(aResponse) {
        resolve(new MIDIAccess(aResponse));
      }, reject);
    }, reject);
  });
};

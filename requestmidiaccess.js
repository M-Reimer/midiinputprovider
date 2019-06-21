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
    this.onstatechange = null;
    this.sysexEnabled = false;
    this.addEventListener = function(){};
    this.removeEventListener = function(){};
    this.dispatchEvent = function(){};

    if (aList) {
      for (var index = 0; index < aList.length; index++) {
        var entry = aList[index];
        this.inputs.set(entry.id, new MIDIInput(entry));
      }
    }
  };

  function MIDIInput(aListEntry) {
    // Constant values
    new Map([
      ['id', aListEntry.id],
      ['name', aListEntry.name],
      ['type', 'input'],
      ['state', 'connected'],
      ['manufacturer', ''],
      ['version', 'ALSA library version 1.1.9']
    ]).forEach((value, name) => {
      Object.defineProperty(this, name, {
        enumerable: true,
        value: value
      });
    });

    // Getter for connection status
    let connection = "closed";
    Object.defineProperty(this, 'connection', {
      enumerable: true,
      get: () => {return connection;}
    });

    // Dummy functions
    this.open = function(){};
    this.close = function(){};
    this.dispatchEvent = function(){};
    this.onstatechange = null;

    // Define our device-internal message callback.
    // Runs over all listeners and forwards messages to them.
    let listeners = [];
    let MidiCallback = (aMIDI) => {
      listeners.forEach((listener) => {
        listener({
          bubbles: true,
          cancelBubble: false,
          cancelable: false,
          composed: false,
          srcElement: this,
          target: this,
          currentTarget: this,
          type: "midimessage",
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
      if (connection == "closed") {
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
    let onmidimessage = null;
    Object.defineProperty(this, 'onmidimessage', {
      set: (aValue) => {
        if (onmidimessage)
          this.removeEventListener("midimessage", onmidimessage);
        this.addEventListener("midimessage", aValue);
        onmidimessage = aValue;
      },
      get: () => {
        return onmidimessage;
      },
      enumerable: true
    });
  }

  return new Promise(function(resolve, reject) {
    window.MidiInputProvider.Init(function() {
      window.MidiInputProvider.GetList(function(aResponse) {
        resolve(new MIDIAccess(aResponse));
      }, reject);
    }, reject);
  });
};

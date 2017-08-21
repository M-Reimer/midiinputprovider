/*
    Firefox addon "MIDI Input Provider"
    Copyright (C) 2017  Manuel Reimer <manuel.reimer@gmx.de>

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

var portList = {};

browser.runtime.onConnect.addListener(function(aPort) {
  // If a MIDI device ID is given as the port name, then this port is meant
  // to subscribe to the MIDI messages of this device.
  if (aPort.name) {
    // No existing connection to this MIDI device --> Connect
    if (!(aPort.name in portList)) {
      var nativePort = browser.runtime.connectNative("midiinputprovider");
      portList[aPort.name] = {count: 1, port: nativePort};
      nativePort.postMessage({command: "connect", id: aPort.name});
    }
    // MIDI device is already open, so just count up the connection counter
    else
      portList[aPort.name].count++;

    // Message handler for this port connection
    var messageHandler = function(aResponse) {
      aPort.postMessage(aResponse);
    }

    // Register message handler
    portList[aPort.name].port.onMessage.addListener(messageHandler);

    // If this port disconnects, count down connection counter and unregister
    // the message handler (which now would point to a disconnected port)
    // If the connection counter reaches zero, disconnect MIDI device
    aPort.onDisconnect.addListener(function(aMessage) {
      portList[aPort.name].count--;
      portList[aPort.name].port.onMessage.removeListener(messageHandler);
      if (portList[aPort.name].count == 0) {
        portList[aPort.name].port.disconnect();
        delete portList[aPort.name];
      }
    });
  }
  // This is for ports which don't connect to a MIDI device.
  // Currently only for getting the device list.
  else {
    var nativePort = browser.runtime.connectNative("midiinputprovider");
    nativePort.onMessage.addListener(function(aResponse) {
      aPort.postMessage(aResponse);
    });
    nativePort.onDisconnect.addListener(function(aResponse) {
      aPort.error = nativePort.error;
      aPort.disconnect();
    });
    aPort.onMessage.addListener(function(aMessage) {
      nativePort.postMessage(aMessage);
    });
    aPort.onDisconnect.addListener(function(aMessage) {
      nativePort.disconnect();
    });
  }
});

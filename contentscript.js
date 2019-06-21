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

// This content script creates somthing like a "very simple MIDI intermediate
// API". It is able to get a list of MIDI devices and to connect a callback to
// a given MIDI device.
// The code in "requestmidiaccess.js" maps this to the "real" WebMIDI API.

var allowed_domains = {};
var ports = {};

// This function gets the list of available MIDI hardware.
// Parameters:
//   aCallbackSuccess: Called if the list was received.
//   aCallbackError: Called on error.
function GetList(aCallbackSuccess, aCallbackError) {
  // Check if page javascript gave us our expected variable types.
  if (typeof aCallbackSuccess !== "function" ||
      typeof aCallbackError !== "function") {
    console.log("MidiInputProvider: Invalid parameters to 'GetList'");
    return;
  }

  // Query background script for the device list.
  var port = browser.runtime.connect();
  port.onMessage.addListener(function(aResponse) {
    var clone = cloneInto(aResponse, our_context);
    aCallbackSuccess(clone);
    port.disconnect();
  });
  port.postMessage({command: "list"});
}

// This function binds a given callback to a MIDI device event queue.
// Parameters:
//   aID: The MIDI devices ID
//   aCallback: The callback to register for this MIDI device
function BindCallback(aID, aCallback) {
  // Check if page javascript gave us our expected variable types.
  if (typeof aID !== "string" ||
      typeof aCallback !== "function") {
    console.log("MidiInputProvider: Invalid parameters to 'BindCallback'");
    return;
  }

  // Ask background script to register a port to the MIDI device.
  var id = cloneInto(aID, our_context);
  var port = browser.runtime.connect({name: id});
  port.onMessage.addListener(function(aResponse) {
    var clone = cloneInto(aResponse, our_context);
    aCallback(clone);
  });
}

// This is the only function exported to page javascript at first
// At this stage there is no interaction with the native helper app
// The Init function checks if the page is allowed to access MIDI
// If so the two missing functions for MIDI interaction are exported into page
// javascript context.
// Parameters:
//   aCallbackSuccess: Called if the domain is allowed to access MIDI
//   aCallbackError: Called on error
function Init(aCallbackSuccess, aCallbackError) {
  // Check if page javascript gave us our expected variable types.
  if (typeof aCallbackSuccess !== "function" ||
      typeof aCallbackError !== "function") {
    console.log("MidiInputProvider: Invalid parameters to 'Init'");
    return;
  }

  // Get page domain.
  var domain = window.location.hostname;

  // Get whitelist from Addon settings.
  var gettingItem = browser.storage.local.get("whitelist");
  gettingItem.then((res) => {
    var whitelist = res.whitelist || "";
    var list = whitelist.split(",");
    if (list.includes(domain) || confirm("Do you want to give one-time permission to " + domain + " to access your MIDI hardware? (Add this domain to the addon whitelist for permanent permission)")) {
      exportFunction(GetList, our_context, {defineAs: "GetList", allowCrossOriginArguments: true});
      exportFunction(BindCallback, our_context, {defineAs: "BindCallback", allowCrossOriginArguments: true});
      aCallbackSuccess();
    }
    else
      aCallbackError();
  });
}

// On startup, just export the "Init" function.
var our_context = createObjectIn(window, {defineAs: "MidiInputProvider"});
exportFunction(Init, our_context, {defineAs: "Init"});

// The following lines inject the code from "requestmidiaccess.js" into page
// context.
var script = document.createElement("script");
script.textContent = "Object.defineProperty(navigator, 'requestMIDIAccess', {enumerable: true, value: " + REQUESTMIDIACCESS.toString() + "});";
document.documentElement.appendChild(script);

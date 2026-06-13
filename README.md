Pebble Watch App

A simple app for toggling OpenHAB items on a Pebble Watch. Tested on Pebble Time 2

You can configure your OpenHAB server address and port, along with item display titles and exact item names in Apps settings in the Pebble App. Item names must match those defined in your OpenHAB setup. Max of 10 items currently

The app controls items by sending HTTP POST requests to the OpenHAB REST API, for example:
http://192.168.1.69:8080/rest/items/bedroom_light
body: "ON" or "OFF"

Designed for use on a local LAN only (no OpenHAB Cloud support).
no automatic discovery of OpenHAB items (yet?)

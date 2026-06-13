var Clay = require('@rebble/clay');
var clayConfig = require('./config');
var clay = new Clay(clayConfig);

/*
  CloudPebble/PebbleKit JS in your environment is not exposing MessageKeys.
  These fallback numeric keys are based on your latest log:

    Payload raw: {"10190":1,"10210":1}

  So:
    10190 = CommandIndex
    10210 = CommandValue
*/
var FALLBACK_KEYS = {
  CommandIndex: '10190',
  CommandValue: '10210',
  Status: null
};

var DEFAULT_SETTINGS = {
  OpenhabServer: '192.168.1.69',
  OpenhabPort: '8080',
  ItemCount: 4,

  ItemTitle1: 'Bedroom Light',
  ItemName1: 'bedroom_light',

  ItemTitle2: 'Light 1',
  ItemName2: 'lightrelay1',

  ItemTitle3: 'Light 2',
  ItemName3: 'lightrelay2',

  ItemTitle4: 'Spare',
  ItemName4: 'spareitem',

  ItemTitle5: '',
  ItemName5: '',

  ItemTitle6: '',
  ItemName6: '',

  ItemTitle7: '',
  ItemName7: '',

  ItemTitle8: '',
  ItemName8: '',

  ItemTitle9: '',
  ItemName9: '',

  ItemTitle10: '',
  ItemName10: ''
};

function loadSettings() {
  var settings = {};
  var stored = localStorage.getItem('clay-settings');
  var key;

  if (stored) {
    try {
      settings = JSON.parse(stored);
      console.log('Loaded clay-settings: ' + stored);
    } catch (e) {
      console.log('Failed to parse clay-settings: ' + e);
      settings = {};
    }
  } else {
    console.log('No clay-settings found, using defaults');
  }

  for (key in DEFAULT_SETTINGS) {
    if (DEFAULT_SETTINGS.hasOwnProperty(key)) {
      if (
        settings[key] === undefined ||
        settings[key] === null ||
        settings[key] === ''
      ) {
        settings[key] = DEFAULT_SETTINGS[key];
      }
    }
  }

  return settings;
}

function getItemName(settings, itemNumber) {
  return settings['ItemName' + itemNumber];
}

function buildOpenhabUrl(settings, itemName) {
  var server = settings.OpenhabServer;
  var port = settings.OpenhabPort;

  server = String(server || '');
  server = server.replace(/^https?:\/\//, '');
  server = server.replace(/\/+$/, '');

  port = String(port || '');
  port = port.replace(':', '');

  return 'http://' + server + ':' + port + '/rest/items/' + encodeURIComponent(itemName);
}

function sendStatusToWatch(success) {
  var msg = {};

  if (typeof MessageKeys !== 'undefined' && MessageKeys.Status !== undefined) {
    msg[MessageKeys.Status] = success ? 1 : 0;
    console.log('Sending Status using MessageKeys.Status: ' + MessageKeys.Status);
  } else if (FALLBACK_KEYS.Status !== null) {
    msg[FALLBACK_KEYS.Status] = success ? 1 : 0;
    console.log('Sending Status using fallback Status key: ' + FALLBACK_KEYS.Status);
  } else {
    console.log('Status key unknown; not sending status back to watch');
    return;
  }

  Pebble.sendAppMessage(
    msg,
    function() {
      console.log('Status sent to watch: ' + success);
    },
    function(e) {
      console.log('Failed to send status to watch: ' + JSON.stringify(e));
    }
  );
}

function postToOpenhab(itemIndex, commandValue) {
  var settings = loadSettings();

  /*
    Watch sends zero-based item index:
      0 = ItemName1
      1 = ItemName2
      ...
      9 = ItemName10
  */
  var itemNumber = itemIndex + 1;
  var itemName = getItemName(settings, itemNumber);

  console.log('itemIndex: ' + itemIndex);
  console.log('itemNumber: ' + itemNumber);
  console.log('itemName: ' + itemName);

  if (!itemName) {
    console.log('No openHAB item configured for index: ' + itemIndex);
    sendStatusToWatch(false);
    return;
  }

  /*
    openHAB Switch items expect text commands:
      ON
      OFF

    The watch sends 1 or 0 to the phone, but the phone sends ON/OFF to openHAB.
  */
  var body = commandValue === 1 ? 'ON' : 'OFF';
  var url = buildOpenhabUrl(settings, itemName);

  console.log('POST ' + url + ' body=' + body);

  var xhr = new XMLHttpRequest();

  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'text/plain');

  xhr.onload = function() {
    console.log('openHAB response HTTP status: ' + xhr.status);
    console.log('openHAB response body: ' + xhr.responseText);

    if (xhr.status >= 200 && xhr.status < 300) {
      sendStatusToWatch(true);
    } else {
      sendStatusToWatch(false);
    }
  };

  xhr.onerror = function() {
    console.log('openHAB request failed');
    sendStatusToWatch(false);
  };

  xhr.ontimeout = function() {
    console.log('openHAB request timed out');
    sendStatusToWatch(false);
  };

  xhr.timeout = 8000;
  xhr.send(body);
}

Pebble.addEventListener('ready', function() {
  console.log('openHAB Pebble app ready');

  if (typeof MessageKeys !== 'undefined') {
    console.log('MessageKeys available');
    console.log('MessageKeys.CommandIndex = ' + MessageKeys.CommandIndex);
    console.log('MessageKeys.CommandValue = ' + MessageKeys.CommandValue);
    console.log('MessageKeys.Status = ' + MessageKeys.Status);
  } else {
    console.log('MessageKeys is undefined');
    console.log('Using fallback CommandIndex key: ' + FALLBACK_KEYS.CommandIndex);
    console.log('Using fallback CommandValue key: ' + FALLBACK_KEYS.CommandValue);
  }
});

Pebble.addEventListener('appmessage', function(e) {
  console.log('Received message from watch');
  console.log('Payload raw: ' + JSON.stringify(e.payload));

  var itemIndex;
  var commandValue;
  var payloadKey;

  /*
    Dump all received payload keys.
    This helps if CloudPebble regenerates numeric message-key IDs again.
  */
  for (payloadKey in e.payload) {
    if (e.payload.hasOwnProperty(payloadKey)) {
      console.log('Payload key: ' + payloadKey + ' value: ' + e.payload[payloadKey]);
    }
  }

  if (typeof MessageKeys !== 'undefined') {
    console.log('Using MessageKeys object');

    console.log('MessageKeys.CommandIndex = ' + MessageKeys.CommandIndex);
    console.log('MessageKeys.CommandValue = ' + MessageKeys.CommandValue);

    itemIndex = e.payload[MessageKeys.CommandIndex];
    commandValue = e.payload[MessageKeys.CommandValue];
  } else {
    console.log('MessageKeys undefined, using hardcoded fallback keys');

    itemIndex = e.payload[FALLBACK_KEYS.CommandIndex];
    commandValue = e.payload[FALLBACK_KEYS.CommandValue];
  }

  console.log('Resolved itemIndex: ' + itemIndex);
  console.log('Resolved commandValue: ' + commandValue);

  if (itemIndex === undefined || commandValue === undefined) {
    console.log('CommandIndex or CommandValue missing from payload');
    sendStatusToWatch(false);
    return;
  }

  itemIndex = Number(itemIndex);
  commandValue = Number(commandValue);

  console.log('Parsed itemIndex: ' + itemIndex);
  console.log('Parsed commandValue: ' + commandValue);

  if (isNaN(itemIndex) || isNaN(commandValue)) {
    console.log('CommandIndex or CommandValue is not numeric');
    sendStatusToWatch(false);
    return;
  }

  postToOpenhab(itemIndex, commandValue);
});
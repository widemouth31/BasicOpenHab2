var Clay = require('@rebble/clay');
var clayConfig = require('./config');
var clay = new Clay(clayConfig);

var ANALYTICS_URL = "http://xxx.xxx.xx.xxx:8787/event";
var ANALYTICS_TOKEN = "6f9f1d8e-";

/*
  Fixed AppMessage key layout.

  These values must match:
    - appinfo.json appKeys
    - package.json pebble.messageKeys order
    - main.c MESSAGE_KEY_* fallback defines
*/
var FALLBACK_KEYS = {
  OpenhabServer: '0',
  OpenhabPort: '1',

  ItemTitle1: '2',
  ItemName1: '3',
  ItemTitle2: '4',
  ItemName2: '5',
  ItemTitle3: '6',
  ItemName3: '7',
  ItemTitle4: '8',
  ItemName4: '9',
  ItemTitle5: '10',
  ItemName5: '11',
  ItemTitle6: '12',
  ItemName6: '13',
  ItemTitle7: '14',
  ItemName7: '15',
  ItemTitle8: '16',
  ItemName8: '17',
  ItemTitle9: '18',
  ItemName9: '19',
  ItemTitle10: '20',
  ItemName10: '21',

  ItemCount: '22',

  CommandIndex: '23',
  CommandValue: '24',
  Status: '25',

  StateIndex: '26',
  StateValue: '27'
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

var watchMessageQueue = [];
var watchMessageBusy = false;

function queueWatchMessage(msg, description) {
  watchMessageQueue.push({
    msg: msg,
    description: description || 'message'
  });

  pumpWatchMessageQueue();
}

function pumpWatchMessageQueue() {
  if (watchMessageBusy) {
    return;
  }

  if (watchMessageQueue.length === 0) {
    return;
  }

  var queued = watchMessageQueue.shift();
  watchMessageBusy = true;

  Pebble.sendAppMessage(
    queued.msg,
    function() {
      console.log('Sent watch ' + queued.description);
      watchMessageBusy = false;
      pumpWatchMessageQueue();
    },
    function(e) {
      console.log('Failed to send watch ' + queued.description + ': ' + JSON.stringify(e));
      watchMessageBusy = false;
      pumpWatchMessageQueue();
    }
  );
}

function getMessageKey(keyName) {
  if (typeof MessageKeys !== 'undefined' && MessageKeys[keyName] !== undefined) {
    return MessageKeys[keyName];
  }

  return FALLBACK_KEYS[keyName];
}

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

function recordRemoteLaunch() {
  var xhr;
  var payload;

  if (!ANALYTICS_URL || ANALYTICS_URL === "http://YOUR-SERVER-IP:8787/event") {
    console.log("Analytics URL not configured");
    return;
  }

  payload = {
    app: "BasicOpenHab",
    event: "launch",
    timestamp: new Date().toISOString()
  };

  try {
    xhr = new XMLHttpRequest();
    xhr.open("POST", ANALYTICS_URL, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("x-analytics-token", ANALYTICS_TOKEN);
    xhr.timeout = 10000;

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        console.log("Analytics launch ping status=" + xhr.status);
      }
    };

    xhr.onerror = function() {
      console.log("Analytics launch ping failed");
    };

    xhr.ontimeout = function() {
      console.log("Analytics launch ping timed out");
    };

    xhr.send(JSON.stringify(payload));
  } catch (e) {
    console.log("Analytics launch error: " + e.message);
  }
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

function buildOpenhabStateUrl(settings, itemName) {
  return buildOpenhabUrl(settings, itemName) + '/state';
}

function sendStatusToWatch(success) {
  var msg = {};
  var statusKey = getMessageKey('Status');

  if (statusKey === undefined || statusKey === null) {
    console.log('Status key unavailable; not sending status back to watch');
    return;
  }

  msg[statusKey] = success ? 1 : 0;

  queueWatchMessage(
    msg,
    'status=' + (success ? 'OK' : 'FAILED')
  );
}

function sendItemStateToWatch(itemIndex, stateValue) {
  var msg = {};
  var stateIndexKey = getMessageKey('StateIndex');
  var stateValueKey = getMessageKey('StateValue');

  if (
    stateIndexKey === undefined ||
    stateIndexKey === null ||
    stateValueKey === undefined ||
    stateValueKey === null
  ) {
    console.log('StateIndex/StateValue keys unavailable; cannot send item state');
    return;
  }

  msg[stateIndexKey] = itemIndex;
  msg[stateValueKey] = stateValue;

  queueWatchMessage(
    msg,
    'state index=' + itemIndex + ' value=' + stateValue
  );
}


function sendSettingsToWatch() {
  var settings = loadSettings();
  var msg = {};

  msg[FALLBACK_KEYS.OpenhabServer] = String(settings.OpenhabServer || '');
  msg[FALLBACK_KEYS.OpenhabPort] = String(settings.OpenhabPort || '');
  msg[FALLBACK_KEYS.ItemCount] = Number(settings.ItemCount || 4);

  msg[FALLBACK_KEYS.ItemTitle1] = String(settings.ItemTitle1 || '');
  msg[FALLBACK_KEYS.ItemName1] = String(settings.ItemName1 || '');

  msg[FALLBACK_KEYS.ItemTitle2] = String(settings.ItemTitle2 || '');
  msg[FALLBACK_KEYS.ItemName2] = String(settings.ItemName2 || '');

  msg[FALLBACK_KEYS.ItemTitle3] = String(settings.ItemTitle3 || '');
  msg[FALLBACK_KEYS.ItemName3] = String(settings.ItemName3 || '');

  msg[FALLBACK_KEYS.ItemTitle4] = String(settings.ItemTitle4 || '');
  msg[FALLBACK_KEYS.ItemName4] = String(settings.ItemName4 || '');

  msg[FALLBACK_KEYS.ItemTitle5] = String(settings.ItemTitle5 || '');
  msg[FALLBACK_KEYS.ItemName5] = String(settings.ItemName5 || '');

  msg[FALLBACK_KEYS.ItemTitle6] = String(settings.ItemTitle6 || '');
  msg[FALLBACK_KEYS.ItemName6] = String(settings.ItemName6 || '');

  msg[FALLBACK_KEYS.ItemTitle7] = String(settings.ItemTitle7 || '');
  msg[FALLBACK_KEYS.ItemName7] = String(settings.ItemName7 || '');

  msg[FALLBACK_KEYS.ItemTitle8] = String(settings.ItemTitle8 || '');
  msg[FALLBACK_KEYS.ItemName8] = String(settings.ItemName8 || '');

  msg[FALLBACK_KEYS.ItemTitle9] = String(settings.ItemTitle9 || '');
  msg[FALLBACK_KEYS.ItemName9] = String(settings.ItemName9 || '');

  msg[FALLBACK_KEYS.ItemTitle10] = String(settings.ItemTitle10 || '');
  msg[FALLBACK_KEYS.ItemName10] = String(settings.ItemName10 || '');

  queueWatchMessage(msg, 'settings sync');
}



function fetchOpenhabItemState(itemIndex) {
  var settings = loadSettings();
  var itemNumber = itemIndex + 1;
  var itemName = getItemName(settings, itemNumber);
  var url;
  var xhr;

  if (itemIndex < 0 || itemIndex >= 10) {
    console.log('State fetch index out of range: ' + itemIndex);
    return;
  }

  if (!itemName) {
    console.log('No item configured for state fetch index=' + itemIndex);
    return;
  }

  url = buildOpenhabStateUrl(settings, itemName);

  console.log('GET ' + url);

  xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Accept', 'text/plain');
  xhr.timeout = 8000;

  xhr.onload = function() {
    var state;

    console.log(
      'State response for ' +
      itemName +
      ': HTTP ' +
      xhr.status +
      ' body=' +
      xhr.responseText
    );

    if (xhr.status >= 200 && xhr.status < 300) {
      state = String(xhr.responseText || '').trim().toUpperCase();

      if (state === 'ON') {
        sendItemStateToWatch(itemIndex, 1);
      } else if (state === 'OFF') {
        sendItemStateToWatch(itemIndex, 0);
      } else {
        console.log('Unsupported/non-switch state for ' + itemName + ': ' + state);
      }
    } else {
      console.log('Failed to fetch state for ' + itemName + ': HTTP ' + xhr.status);
    }
  };

  xhr.onerror = function() {
    console.log('State request failed for ' + itemName);
  };

  xhr.ontimeout = function() {
    console.log('State request timed out for ' + itemName);
  };

  xhr.send();
}

function refreshAllOpenhabStates() {
  var settings = loadSettings();
  var count = Number(settings.ItemCount || 0);
  var i;

  if (isNaN(count) || count < 1) {
    count = 1;
  }

  if (count > 10) {
    count = 10;
  }

  console.log('Refreshing openHAB states for ' + count + ' configured items');

  for (i = 0; i < count; i++) {
    fetchOpenhabItemState(i);
  }
}

function postToOpenhab(itemIndex, commandValue) {
  var settings = loadSettings();
  var itemNumber = itemIndex + 1;
  var itemName = getItemName(settings, itemNumber);
  var body;
  var url;
  var xhr;

  console.log('itemIndex: ' + itemIndex);
  console.log('itemNumber: ' + itemNumber);
  console.log('itemName: ' + itemName);

  if (itemIndex < 0 || itemIndex >= 10) {
    console.log('CommandIndex out of range: ' + itemIndex);
    sendStatusToWatch(false);
    return;
  }

  if (commandValue !== 0 && commandValue !== 1) {
    console.log('CommandValue invalid: ' + commandValue);
    sendStatusToWatch(false);
    return;
  }

  if (!itemName) {
    console.log('No openHAB item configured for index: ' + itemIndex);
    sendStatusToWatch(false);
    return;
  }

  body = commandValue === 1 ? 'ON' : 'OFF';
  url = buildOpenhabUrl(settings, itemName);

  console.log('POST ' + url + ' body=' + body);

  xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'text/plain');
  xhr.timeout = 8000;

  xhr.onload = function() {
    console.log('openHAB response HTTP status: ' + xhr.status);
    console.log('openHAB response body: ' + xhr.responseText);

    if (xhr.status >= 200 && xhr.status < 300) {
      sendStatusToWatch(true);
      fetchOpenhabItemState(itemIndex);
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

  xhr.send(body);
}

Pebble.addEventListener('ready', function() {
  console.log('openHAB Pebble app ready');

  recordRemoteLaunch();

  if (typeof MessageKeys !== 'undefined') {
    console.log('MessageKeys available');
    console.log('MessageKeys.CommandIndex = ' + MessageKeys.CommandIndex);
    console.log('MessageKeys.CommandValue = ' + MessageKeys.CommandValue);
    console.log('MessageKeys.Status = ' + MessageKeys.Status);
    console.log('MessageKeys.StateIndex = ' + MessageKeys.StateIndex);
    console.log('MessageKeys.StateValue = ' + MessageKeys.StateValue);
  } else {
    console.log('MessageKeys is undefined; using fallback keys');
    console.log('Fallback CommandIndex key: ' + FALLBACK_KEYS.CommandIndex);
    console.log('Fallback CommandValue key: ' + FALLBACK_KEYS.CommandValue);
    console.log('Fallback Status key: ' + FALLBACK_KEYS.Status);
    console.log('Fallback StateIndex key: ' + FALLBACK_KEYS.StateIndex);
    console.log('Fallback StateValue key: ' + FALLBACK_KEYS.StateValue);
  }
  sendSettingsToWatch();
  refreshAllOpenhabStates();
});

Pebble.addEventListener('appmessage', function(e) {
  console.log('Received message from watch');
  console.log('Payload raw: ' + JSON.stringify(e.payload));

  var itemIndex;
  var commandValue;
  var payloadKey;
  var commandIndexKey = getMessageKey('CommandIndex');
  var commandValueKey = getMessageKey('CommandValue');

  for (payloadKey in e.payload) {
    if (e.payload.hasOwnProperty(payloadKey)) {
      console.log('Payload key: ' + payloadKey + ' value: ' + e.payload[payloadKey]);
    }
  }

  console.log('Using CommandIndex key: ' + commandIndexKey);
  console.log('Using CommandValue key: ' + commandValueKey);

  itemIndex = e.payload[commandIndexKey];
  commandValue = e.payload[commandValueKey];

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

Pebble.addEventListener('webviewclosed', function(e) {
  console.log('Configuration closed');

  /*
    Clay normally saves settings to localStorage.
    We then manually push the saved settings to the watch using fixed numeric keys.
  */
  sendSettingsToWatch();
  refreshAllOpenhabStates();
});
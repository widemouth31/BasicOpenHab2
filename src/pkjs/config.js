module.exports = [
  {
    type: 'heading',
    defaultValue: 'openHAB Controls'
  },
  {
    type: 'text',
    defaultValue: 'Configure your openHAB server and up to 10 switch items.'
  },
  {
    type: 'section',
    items: [
      {
        type: 'heading',
        defaultValue: 'Server'
      },
      {
        type: 'input',
        messageKey: 'OpenhabServer',
        label: 'openHAB Server/IP',
        defaultValue: '192.168.1.69',
        description: 'Do not include http://. Example: 192.168.1.69'
      },
      {
        type: 'input',
        messageKey: 'OpenhabPort',
        label: 'openHAB Port',
        defaultValue: '8080',
        attributes: {
          type: 'number'
        },
        description: 'Example: 80 or 8080 or 9090'
      },
      {
        type: 'select',
        messageKey: 'ItemCount',
        label: 'Number of menu items',
        defaultValue: 4,
        options: [
          { label: '1 item', value: 1 },
          { label: '2 items', value: 2 },
          { label: '3 items', value: 3 },
          { label: '4 items', value: 4 },
          { label: '5 items', value: 5 },
          { label: '6 items', value: 6 },
          { label: '7 items', value: 7 },
          { label: '8 items', value: 8 },
          { label: '9 items', value: 9 },
          { label: '10 items', value: 10 }
        ],
        description: 'Only this many configured items will be shown on the Pebble menu.'
      }
    ]
  },

  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Item 1' },
      {
        type: 'input',
        messageKey: 'ItemTitle1',
        label: 'Menu Title',
        defaultValue: 'Bedroom Light'
      },
      {
        type: 'input',
        messageKey: 'ItemName1',
        label: 'openHAB Item Name',
        defaultValue: 'bedroom_light'
      }
    ]
  },

  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Item 2' },
      {
        type: 'input',
        messageKey: 'ItemTitle2',
        label: 'Menu Title',
        defaultValue: 'Light 1'
      },
      {
        type: 'input',
        messageKey: 'ItemName2',
        label: 'openHAB Item Name',
        defaultValue: 'lightrelay1'
      }
    ]
  },

  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Item 3' },
      {
        type: 'input',
        messageKey: 'ItemTitle3',
        label: 'Menu Title',
        defaultValue: 'Light 2'
      },
      {
        type: 'input',
        messageKey: 'ItemName3',
        label: 'openHAB Item Name',
        defaultValue: 'lightrelay2'
      }
    ]
  },

  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Item 4' },
      {
        type: 'input',
        messageKey: 'ItemTitle4',
        label: 'Menu Title',
        defaultValue: 'Spare'
      },
      {
        type: 'input',
        messageKey: 'ItemName4',
        label: 'openHAB Item Name',
        defaultValue: 'spareitem'
      }
    ]
  },

  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Item 5' },
      {
        type: 'input',
        messageKey: 'ItemTitle5',
        label: 'Menu Title',
        defaultValue: ''
      },
      {
        type: 'input',
        messageKey: 'ItemName5',
        label: 'openHAB Item Name',
        defaultValue: ''
      }
    ]
  },

  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Item 6' },
      {
        type: 'input',
        messageKey: 'ItemTitle6',
        label: 'Menu Title',
        defaultValue: ''
      },
      {
        type: 'input',
        messageKey: 'ItemName6',
        label: 'openHAB Item Name',
        defaultValue: ''
      }
    ]
  },

  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Item 7' },
      {
        type: 'input',
        messageKey: 'ItemTitle7',
        label: 'Menu Title',
        defaultValue: ''
      },
      {
        type: 'input',
        messageKey: 'ItemName7',
        label: 'openHAB Item Name',
        defaultValue: ''
      }
    ]
  },

  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Item 8' },
      {
        type: 'input',
        messageKey: 'ItemTitle8',
        label: 'Menu Title',
        defaultValue: ''
      },
      {
        type: 'input',
        messageKey: 'ItemName8',
        label: 'openHAB Item Name',
        defaultValue: ''
      }
    ]
  },

  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Item 9' },
      {
        type: 'input',
        messageKey: 'ItemTitle9',
        label: 'Menu Title',
        defaultValue: ''
      },
      {
        type: 'input',
        messageKey: 'ItemName9',
        label: 'openHAB Item Name',
        defaultValue: ''
      }
    ]
  },

  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Item 10' },
      {
        type: 'input',
        messageKey: 'ItemTitle10',
        label: 'Menu Title',
        defaultValue: ''
      },
      {
        type: 'input',
        messageKey: 'ItemName10',
        label: 'openHAB Item Name',
        defaultValue: ''
      }
    ]
  },

  {
    type: 'submit',
    defaultValue: 'Save Settings'
  }
];
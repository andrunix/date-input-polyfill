# neo-date-input-polyfill
Just include this simple script and IE, Firefox, and OS X Safari will support `<input type="date">`, without any dependencies, not even jQuery!

Support dynamically created inputs, so can be used in single page applications.

Forked from [date-input-polyfill](https://github.com/jcgertig/date-input-polyfilll). That project appears
to be abandonded so instea of doing a PR, I am moving forward with this while I still need a date polyfill.

## Install
`npm install --save neo-date-input-polyfill`

Add to your project:

* **Webpack/Browserify:** `require('neo-date-input-polyfill');`

    or alongside **Babel:** `import 'neo-date-input-polyfill';`

* **Script Tag:** Copy `dist/neo-date-input-polyfill.min.js` from `node_modules` and
include it anywhere in your HTML.

* This package also supports **AMD**.

## Features
* **Easily Stylable:** [These are the default styles](https://github.com/andrunix/neo-date-input-polyfill/blob/master/src/neo-date-input-polyfill.scss),
which you may override with your own.

* **Polyfills `valueAsDate` and `valueAsNumber`:**
[Learn more about these properties.](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement#property-valueasdate)
They behave as getters and setters.

* **Keyboard Shortcuts:** `Esc` will hide the datepicker. `Up/Down` will
increment/decrement the date by one day.

* **Localization:** Specify the datepicker's locale by setting the
`lang` attribute of the `input` element.  The default locale is `en`.

    `<input type="date" lang="en" />`

* **Formatting:** Specify the display format by setting either the
`date-format` or `data-date-format` attribute of the `input` element.  The default format is `yyyy-mm-dd`.
[Available options list.](https://github.com/felixge/node-dateformat#mask-options)

    `<input type="date" date-format="mm/dd/yyyy" />`
    
    `<input type="date" data-date-format="mm/dd/yyyy" />`


## Contributing

### Local Development
Run `npm start` or, for Cloud9 IDE users: `npm run start-c9`

### Build
Run `npm run build`

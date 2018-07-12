import thePicker from './picker.js';
import locales from './locales.js';
import dateFormat from './dateformat.js';

const ESCAPE = 27;
const TAB = 9;
const UP = 39;
const DOWN = 40;
const SLASH = 191;

export default class Input {
  constructor(input) {
    this.escWasPressed = false;
    this.element = input;
    this.element.setAttribute(`data-has-picker`, ``);

    this.locale =
      this.element.getAttribute(`lang`)
      || document.body.getAttribute(`lang`)
      || `en`;

    this.format = this.element.getAttribute('date-format')
      || document.body.getAttribute('date-format')
      || this.element.getAttribute(`data-date-format`)
      || document.body.getAttribute(`data-date-format`)
      || `yyyy-mm-dd`;

    this.localeText = this.getLocaleText();

    Object.defineProperties(
      this.element,
      {
        'valueAsDate': {
          get: () => {
            if(!this.element.value) {
              return null;
            }
            const format = this.format || 'yyyy-mm-dd';
            const parts = this.element.value.match(/(\d+)/g);
            let i = 0, fmt = {};

            format.replace(/(yyyy|dd|mm)/g, part=> {
              fmt[part] = i++;
            });
            return new Date(parts[fmt['yyyy']], parts[fmt['mm']]-1, parts[fmt['dd']]);
          },
          set: val => {
            this.element.value = dateFormat(val, this.format);
          }
        },
        'valueAsNumber': {
          get: ()=> {
            if(!this.element.value) {
              return NaN;
            }
            return this.element.valueAsDate.valueOf();
          },
          set: val=> {
            this.element.valueAsDate = new Date(val);
          }
        }
      }
    );

    const findTabStop = (forward, el) => {
      const universe = document.querySelectorAll('input, button, select, textarea, a[href]');
      const list = Array.prototype.filter.call(universe, (item) => item.tabIndex >= "0");
      const index = list.indexOf(el);
      const next = index + (forward ? 1 : -1);
      return list[next] || list[0];
    };

    const findNextTabStop = (el) => findTabStop(true, el);
    const findPreviousTabStop = (el) => findTabStop(false, el);

    // Open the picker when the input get focus,
    // also on various click events to capture it in all corner cases.
    const showPicker = (e) => {
      const elm = this.element;
      elm.locale = this.localeText;
      if (!this.escWasPressed) {
        const didAttach = thePicker.attachTo(elm);
      }
      this.escWasPressed = false;
    };
    this.element.addEventListener(`focus`, showPicker);
    this.element.addEventListener(`mouseup`, showPicker);

    // Update the picker if the date changed manually in the input.
    this.element.addEventListener(`keydown`, e => {
      const date = new Date();

      switch(e.keyCode) {
      case TAB:  // tab
        e.preventDefault();
        thePicker.hide();

        let nextEl = this.element;

        if (e.shiftKey) { // backtab
          nextEl = findPreviousTabStop(this.element);
        } else {
          nextEl = findNextTabStop(this.element);
        }
        
        if (nextEl) {
          nextEl.focus();
        }
        break;
        
      case ESCAPE: // esc
        this.escWasPressed = true;
        thePicker.hide();
        this.element.focus();  // return the focus to the input element
        break;
        
      case UP:
        if(this.element.valueAsDate) {
          date.setDate(this.element.valueAsDate.getDate() + 1);
          this.element.valueAsDate = date;
          thePicker.pingInput();
        }
        break;
        
      case DOWN:
        if(this.element.valueAsDate) {
          date.setDate(this.element.valueAsDate.getDate() - 1);
          this.element.valueAsDate = date;
          thePicker.pingInput();
        }
        break;

      case SLASH:
        if (this.element.value.endsWith('/'))
          e.preventDefault();
        break;
      default:
        // console.log('keycode: ', e.keyCode);
        break;
      }
      thePicker.sync();
    });

    const validateMonth = month => (month > 0 && month < 13) ? ('0' + month).slice(-2) : '01';
    const validateDaysInMonth = (day, month) => {
      const days = [ '01', 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
      if (day === 0) {
        return '01';
      } else {
        return ('0' + ((days[month] <= day) ? days[month] : day)).slice(-2);
      }
    }
    
    const fullDateValidation = function(val) {
      const pieces = val.split('/');
      let value = val;
      if (pieces.length === 3 && !isNaN(parseInt(pieces[0]) && !isNaN(parseInt(pieces[1])))) {
        pieces[0] = validateMonth(parseInt(pieces[0]));
        pieces[1] = validateDaysInMonth(parseInt(pieces[1]), parseInt(pieces[0]));
        value = pieces.join('/');
      }
      return value;
    }

    this.element.addEventListener(`keyup`, e => {
      const val = this.element.value;
      // here's some custom code to determine if you are typing in a valid date
      // console.log('value: ' + val, ' code: ', e.keyCode);

      if (this.element.value.length === 2) {
        if (parseInt(this.element.value) > 12) {
          this.element.value = '12';
        }
        if (parseInt(this.element.value) < 1) {
          this.element.value = '01';
        }
        if (e.keyCode === SLASH) {
          this.element.value = "0" + this.element.value;
        }
      }

      // so, it is possible to have a value of like, 2/ which is valid
      if (val.length === 2 && val[1] !== '/' && !isNaN(parseInt(val))) {
        this.element.value += '/';
      }
      
      // see if we have an existing slash, split on it
      if (val.length === 5 && val[2] === '/' && val[4] !== '/') {
        console.log('A');
        const pieces = val.split('/');
        if (!isNaN(parseInt(pieces[0]) && !isNaN(parseInt(pieces[1])))) {
          // before we add that slash, let's check the day against the number of days in the month
          pieces[1] = validateDaysInMonth(parseInt(pieces[1]), parseInt(pieces[0]));
          this.element.value = pieces.join('/');
          this.element.value += "/";
        }
      }

      // finally, if they have a full date entered, with slashes,
      // select the month or day portions, and enter an invalid value,
      // update with the nearest

      const n = (val.match( /\//g ) || []).length;
      if (val.length === 10 && n === 2) {
        this.element.value = fullDateValidation(val);
      }
      thePicker.sync();
    });

    this.element.addEventListener(`keypress`, e => {
      const validKey = (key) => (!(key !== TAB && key !== ESCAPE &&  (key < 47 || key > 57))) ;
      if (!validKey(e.keyCode)) {
        // console.log('bad value! ' + e.keyCode);
        e.preventDefault();
      }
    });

    this.element.addEventListener(`blur`, e => {
      this.element.value = fullDateValidation(this.element.value);
    });
  }

  getLocaleText() {
    const locale = this.locale.toLowerCase();

    for(const localeSet in locales) {
      const localeList = localeSet.split(`_`);
      localeList.map(el=>el.toLowerCase());

      if(
        !!~localeList.indexOf(locale)
        || !!~localeList.indexOf(locale.substr(0,2))
      ) {
        return locales[localeSet];
      }
    }
  }

  // Return false if the browser does not support input[type="date"].
  static supportsDateInput() {
    const input = document.createElement(`input`);
    input.setAttribute(`type`, `date`);

    const notADateValue = `not-a-date`;
    input.setAttribute(`value`, notADateValue);

    return !(input.value === notADateValue);
  }

  // Will add the Picker to all inputs in the page.
  static addPickerToDateInputs() {
    // Get and loop all the input[type="date"]s in the page that do not have `[data-has-picker]` yet.
    const dateInputs = document.querySelectorAll(`input[type="date"]:not([data-has-picker])`);
    const length = dateInputs.length;

    if(!length) {
      return false;
    }

    for(let i = 0; i < length; ++i) {
      new Input(dateInputs[i]);
    }
  }

  static addPickerToOtherInputs() {
    // Get and loop all the input[type="text"] class date-polyfill in the page that do not have `[data-has-picker]` yet.
    const dateInputs = document.querySelectorAll(`input[type="text"].date-polyfill:not([data-has-picker])`);
    const length = dateInputs.length;

    if(!length) {
      return false;
    }

    for(let i = 0; i < length; ++i) {
      new Input(dateInputs[i]);
    }
  }
}

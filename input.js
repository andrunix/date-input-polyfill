import thePicker from './picker.js';
import locales from './locales.js';
import dateFormat from './dateformat.js';

const ESCAPE = 27;
const TAB = 9;
const UP = 39;
const DOWN = 40;


function findTabStop(forward, el) {
  const universe = document.querySelectorAll('input, button, select, textarea, a[href]');
  const list = Array.prototype.filter.call(universe, (item) => item.tabIndex >= "0");
  const index = list.indexOf(el);
  const next = index + (forward ? 1 : -1);
  return list[next] || list[0];
}

const findNextTabStop = (el) => findTabStop(true, el);
const findPreviousTabStop = (el) => findTabStop(false, el);

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
        // e.stopPropagation();
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
      default:
        break;
      }
      thePicker.sync();
    });

    this.element.addEventListener(`keyup`, e => {
      thePicker.sync();
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

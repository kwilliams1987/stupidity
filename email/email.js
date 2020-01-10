"use strict";

(_ => {
    /**
     * @type {HTMLSpanElement}
     */
    let activeElement = null;

    /**
     * @type {HTMLDivElement}
     */
    let keyboard = null;

    /**
     * @type {Boolean}
     */
    let init = false;

    /**
     * @type {Number}
     */
    let complexity = 0;

    /**
     * @type {String}
     */
    let sliderKeys = "";

    /**
     * @type {EventTarget[]}
     */
    let attachedSelectors = [];

    let valueCache = [];

    /**
     * @type {HTMLFormElement[]}
     */
    let attachedForms = [];

    //const chardata = "W3siYmFzZSI6NDMsImxlbmd0aCI6MX0seyJiYXNlIjo0NSwibGVuZ3RoIjoyfSx7ImJhc2UiOjQ4LCJsZW5ndGgiOjEwfSx7ImJhc2UiOjY0LCJsZW5ndGgiOjF9LHsiYmFzZSI6OTUsImxlbmd0aCI6MX0seyJiYXNlIjo5NywibGVuZ3RoIjoyNn0seyJiYXNlIjo4NTkyLCJsZW5ndGgiOjF9XQ";
    const chardata = "W3siYmFzZSI6MzIsImxlbmd0aCI6OTR9LHsiYmFzZSI6ODU5MiwibGVuZ3RoIjoxfV0=";
    /**
     * @type {String[]}
     */
    const keycodes = JSON.parse(atob(chardata))
        .map(c => [...Array(c.length).keys()].map(o => String.fromCharCode(c.base + o))).flat();

    /**
     * @param {HTMLDivElement} keyboard
     */
    const randomizeKeys = function(keyboard) {
        let slider = Array.from(keyboard.querySelectorAll("input[type=range], button.select, hr")).forEach(e => e.remove());

        let buttons = Array.from(keyboard.querySelectorAll("button"));

        keycodes.sort(_ => 0.5 - Math.random()).forEach((code, index) => {
            var current = buttons[index];
            if (current === undefined) {
                var key = document.createElement("button");
                key.classList.add("keyboard");
                key.innerHTML = `&nbsp;${code}&nbsp;`;

                keyboard.appendChild(key);
                buttons.push(key);
            } else {
                current.innerHTML = `&nbsp;${code}&nbsp;`;
            }
        });
    }

    /**
     * @param {HTMLDivElement} keyboard
     */
    const randomizeSlider = function(keyboard) {
        Array.from(keyboard.querySelectorAll("button")).filter(b => !b.classList.contains("select")).forEach(b => b.remove());
        /**
         * @type {HTMLInputElement}
         */
        let slider = keyboard.querySelector("input[type=range]");

        sliderKeys = keycodes.sort(_ => 0.5 - Math.random()).join("");

        if (slider === null) {
            let span = document.createElement("span");
            span.innerHTML = `&nbsp;${sliderKeys[0]}&nbsp;`;
            span.style.width = "1.5em";
            span.style.display = "inline-block";
            span.style.color = "white";

            slider = document.createElement("input");
            slider.type = "range";
            slider.min = 0;
            slider.max = keycodes.length - 1;
            slider.style.width = "calc(100% - 1.5em)";
            slider.style.minWidth = "400px";

            slider.addEventListener("input", e => {
                let code = sliderKeys[slider.value];
                span.innerHTML = `&nbsp;${code}&nbsp;`;
            });

            keyboard.appendChild(slider);
            keyboard.appendChild(span);
            keyboard.appendChild(document.createElement("hr"));

            let button = document.createElement("button");
            button.innerHTML = "Select";
            button.classList.add("select");
            keyboard.appendChild(button);
        }

        slider.value = 0;
        slider.dispatchEvent(new Event("input"));
    }

    /**
     * @returns {HTMLDivElement}
     */
    const getKeyboard = function() {
        if (keyboard === null) {
            keyboard = document.createElement("div");
            keyboard.classList.add("keyboard");

            keyboard.addEventListener("click", e => {
                if (e.target.nodeName == "BUTTON") {
                    e.preventDefault();

                    let key = null;

                    switch (complexity) {
                        case 0:
                            key = e.target.innerHTML[6];
                            break;
                        case 1:
                            key = sliderKeys[keyboard.querySelector("input[type=range").value];
                            break;
                    }

                    switch (key.charCodeAt(0)) {
                        case 8592:
                            activeElement.innerHTML = activeElement.innerHTML.slice(0, -1);
                            break;

                        default:
                            activeElement.innerHTML += key;
                            break;
                    }

                    switch (complexity) {
                        case 0:
                            randomizeKeys(keyboard);
                            break;
                        case 1:
                            randomizeSlider(keyboard);
                            break;
                    }

                    valueCache.find(c => c.element == activeElement).value = activeElement.innerHTML;
                }
            });
        }

        switch (complexity) {
            case 0:
                randomizeKeys(keyboard);
                break;
            case 1:
                randomizeSlider(keyboard);
                break;
        }

        return keyboard;
    }

    const closeKeyBoard = function() {
        if (activeElement === null) {
            return;
        }

        if (keyboard !== null) {
            keyboard.hidden = true;
        }

        activeElement = null;
    };

    /**
     * @this {HTMLSpanElement}
     * @param {Event} event
     */
    const openKeyboard = function(event) {
        event.stopPropagation();

        if (activeElement === this) {
            return;
        }

        closeKeyBoard();
        activeElement = this;

        this.insertAdjacentElement('afterend', getKeyboard(this));
        keyboard.hidden = false;
    };

    const parseOptions = function(options) {
        options = options || {};

        if (!(options.complexitySelector instanceof HTMLInputElement) && !(options.complexitySelector instanceof HTMLSelectElement)) {
            options.complexitySelector = null;
        }

        if (options.complexity === undefined) {
            if (options.complexitySelector instanceof HTMLInputElement) {
                options.complexity = options.complexitySelector.value;
            } else if (options.complexitySelector instanceof HTMLSelectElement) {
                options.complexity = options.complexitySelector.options[options.complexitySelector.selectedIndex].value;
            } else {
                options.complexity = 0;
            }
        }

        options.complexity = parseInt(options.complexity);
        if (options.complexity === NaN) {
            options.complexity = 0;
        }

        return options;
    }

    /**
     * @returns {void}
     */
    HTMLInputElement.prototype.superKeyboard = function(options) {
        options = parseOptions(options);
        complexity = options.complexity;

        if (init !== true) {
            document.addEventListener("click", e => {
                if (e.target.matches('.keyboard') || e.target.matches(".keyboard *")) {
                    return;
                }

                closeKeyBoard();
            });

            init = true;
        }

        let form = this.closest("form");
        if (!attachedForms.includes(form)) {
            form.addEventListener('submit', e => {
                let emails = Array.from(e.target.querySelectorAll("span.keyboard.email"));
                emails.forEach(e => {
                    let field = document.createElement("input");
                    field.type = "email";
                    field.name = e.dataset.name;
                    field.value = e.innerHTML;
                    e.insertAdjacentElement("afterend", field);
                    e.remove();
                });
            });

            form.addEventListener("reset", e => {
                let emails = Array.from(e.target.querySelectorAll("span.keyboard.email"));
                emails.forEach(e => {
                    e.innerHTML = e.dataset.initial;
                });
            });

            attachedForms.push(form);
        }

        if (options.complexitySelector !== null && !attachedSelectors.includes(options.complexitySelector)) {
            options.complexitySelector.addEventListener('change', e => {
                let value = 0;
                if (e.target instanceof HTMLSelectElement) {
                    value = parseInt(e.target.options[e.target.selectedIndex].value);
                }

                if (e.target instanceof HTMLInputElement) {
                    value = parseInt(e.target.value);
                }

                complexity = value;
            });
        }

        let field = document.createElement("span");
        field.dataset.name = this.name;
        field.classList.add("keyboard", "email");
        field.innerHTML = this.value;
        field.dataset.initial = this.value;
        field.dataset.complexity = options.complexity;
        field.tabIndex = 0;

        field.addEventListener('click', openKeyboard);
        field.addEventListener('focus', openKeyboard);

        valueCache.push({ element: field, value: field.innerHTML });

        this.insertAdjacentElement("beforebegin", field);
        this.remove();
    };

    if (true) {
        setInterval(_ => { debugger; }, 1);
        setInterval(_ => {
            valueCache.forEach(e => {
                e.element.innerHTML = e.value;
            });
        }, 10);

        const disableDevtools = callback => {
            const original = Object.getPrototypeOf;

            Object.getPrototypeOf = (...args) => {
                if (Error().stack.includes("getCompletions")) callback();
                return original(...args);
            };
        };

        disableDevtools(() => {
            while (1);
        });
    }
})();
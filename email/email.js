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
        let buttons = Array.from(keyboard.querySelectorAll("button")); //.forEach(b => b.remove());

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
     * @returns {HTMLDivElement}
     */
    const getKeyboard = function() {
        if (keyboard === null) {
            keyboard = document.createElement("div");
            keyboard.classList.add("keyboard");

            keyboard.addEventListener("click", e => {
                if (e.target.nodeName == "BUTTON") {
                    e.preventDefault();

                    let key = e.target.innerHTML;
                    switch (key.charCodeAt(6)) {
                        case 8592:
                            activeElement.innerHTML = activeElement.innerHTML.substring(0, Math.max(activeElement.innerHTML.length - 2, 0));
                            break;

                        default:
                            activeElement.innerHTML += key[6];
                            break;
                    }

                    randomizeKeys(keyboard);
                }
            });
        }

        randomizeKeys(keyboard);
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

    /**
     * @returns {void}
     */
    HTMLInputElement.prototype.addKeyboard = function() {
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
        if (form.dataset.initEmails !== "1") {
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

            form.dataset.initEmails = "1";
        }

        let field = document.createElement("span");
        field.dataset.name = this.name;
        field.classList.add("keyboard", "email");
        field.innerHTML = this.value;
        field.dataset.initial = this.value;
        field.tabIndex = 0;

        field.addEventListener('click', openKeyboard);
        field.addEventListener('focus', openKeyboard);

        this.insertAdjacentElement("beforebegin", field);
        this.remove();
    };
})();
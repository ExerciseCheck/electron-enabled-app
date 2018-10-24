(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
;(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.popupS = factory();
    }

}(this, function () {
    'use strict';

    var isOpen = false,
        queue  = [];

    // Match image file
    var R_IMG = new RegExp( /([^\/\\]+)\.(jpg|jpeg|png|gif)$/i );

    var _defaults = {
        additionalBaseClass: '',
        additionalButtonHolderClass: '',
        additionalButtonOkClass: '',
        additionalButtonCancelClass: '',
        additionalCloseBtnClass: '',
        additionalFormClass: '',
        additionalOverlayClass: '',
        additionalPopupClass: '',
        appendLocation: (document.body || document.documentElement),
        baseClassName: 'popupS',
        closeBtn: '&times;',
        flagBodyScroll: false,
        flagButtonReverse: false,
        flagCloseByEsc: true,
        flagCloseByOverlay: true,
        flagShowCloseBtn: true,
        labelOk: 'OK',
        labelCancel: 'Cancel',
        loader: 'spinner',
        zIndex: 10000
    }

    var transition = (function() {
        var t, type;
        var supported = false;
        var el = document.createElement("fakeelement");
        var transitions = {
            "WebkitTransition": "webkitTransitionEnd",
            "MozTransition": "transitionend",
            "OTransition": "otransitionend",
            "transition": "transitionend"
        };

        for(t in transitions) {
            if (transitions.hasOwnProperty(t) && el.style[t] !== undefined) {
                type = transitions[t];
                supported = true;
                break;
            }
        }

        return {
            type: type,
            supported: supported
        };
    })()

    /**
     * @class   PopupS
     */
    function PopupS() {}

    PopupS.prototype = {
        constructor: PopupS,

        _open: function(options) {
            //error catching
            if (typeof options.mode !== "string") throw new Error("mode must be a string");
            if (typeof options.title !== "undefined" && typeof options.title !== "string") throw new Error("title must be a string");
            if (typeof options.placeholder !== "undefined" && typeof options.placeholder !== "string") throw new Error("placeholder must be a string");

            this.options = options = _extend({}, options);

            // Set default options
            for (var name in _defaults) {
                !(name in options) && (options[name] = _defaults[name]);
            }

            // trail all classes divided by periods
            _each(['additionalBaseClass', 'additionalButtonHolderClass', 'additionalButtonOkClass', 'additionalButtonCancelClass', 'additionalCloseBtnClass', 'additionalFormClass', 'additionalOverlayClass', 'additionalPopupClass'], function(option) {
                var string = options[option].split(' ').join('.');
                options[option] = '.' + string;
            });

            // Bind all private methods
            for (var fn in this) {
                if (fn.charAt(0) === '_') {
                    this[fn] = _bind(this, this[fn]);
                }
            }

            //initialize if it hasn't already been done
            this._init();

            // if it is forced, close all others
            if(options.force === true) {
                while (queue.length > 0) queue.pop();
            }
            queue.push(options);

            if(!isOpen || options.force === true) this._create();
        },
        _init: function() {
            // if i passed a opacity attribute to the layer onClose, remove it on initialization
            if(this.$layerEl && this.$layerEl.style.opacity) this.$layerEl.style.opacity = "";
            if(!this.$wrapEl){
                this.$wrapEl = _buildDOM({
                    tag: 'div.' + this.options.baseClassName + '-base' + (this.options.additionalBaseClass ? this.options.additionalBaseClass : ''),
                    css: {
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        position: 'fixed',
                        textAlign: 'center',
                        overflowX: 'auto',
                        overflowY: 'auto',
                        outline: 0,
                        whiteSpace: 'nowrap',
                        zIndex: this.options.zIndex
                    },
                    children: {
                        css: {
                            height: '100%',
                            display: 'inline-block',
                            verticalAlign: 'middle'
                        }
                    }
                });
                _appendChild(this.$wrapEl, this._getOverlay());
                _appendChild(this.$wrapEl, this._getLayer());
            }
        },
        _getOverlay: function () {
            if (!this.$overlayEl) {
                this.$overlayEl = _buildDOM({
                    tag: '#popupS-overlay.' + this.options.baseClassName + '-overlay' + (this.options.additionalOverlayClass ? this.options.additionalOverlayClass : ''),
                    css: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        position: 'fixed',
                        overflowX: 'hidden',
                        userSelect: 'none',
                        webkitUserSelect: 'none',
                        MozUserSelect: 'none'
                    }
                });
            }
            this.$overlayEl.setAttribute("unselectable", "on");
            return this.$overlayEl;
        },
        _getLayer: function () {
            if(!this.$layerEl){
                this.$layerEl = _buildDOM({
                    css: {
                        display: 'inline-block',
                        position: 'relative',
                        textAlign: 'left',
                        whiteSpace: 'normal',
                        verticalAlign: 'middle',
                        maxWidth: '100%',
                        overflowX: 'hidden',
                        transform: 'translate3d(0,0,0)'
                    },
                    children: {
                        tag: '.' + this.options.baseClassName + '-layer' + (this.options.additionalPopupClass ? this.options.additionalPopupClass : '')
                    }
                });
            }
            return this.$layerEl;
        },
        _resetLayer: function(){
            this.$layerEl.childNodes[0].innerHTML = '';
        },
        /**
         * Takes the first item from the queue
         * creates or overwrites the Overlay and adds Events.
         */
        _create: function () {
            var self = this;
            var item = queue[0];
            var mode = item.mode;
            isOpen = true;
            // Creates the Popup. Overwrites the old one if one exists.
            if (mode != 'modal-ajax') {
                this._createPopup(item);
            } else {
                this._loadContents(item);
            }
            // this is very important for the callback function.
            // these lines make sure callbacks on the same function object will be displayed.
            var transitionDone = function(event) {
                event.stopPropagation();
                _unbind(self.$layerEl, transition.type, transitionDone);
            };
            if(transition.supported){
                _bind(self.$layerEl, transition.type, transitionDone);
            }
        },
        _createPopup: function(item) {
            var btnOk, btnCancel, htmlObj;
            var mode        = item.mode;
            var title       = item.title;
            var content     = item.content;
            var className   = (item.className ? '.' + item.className : '');
            var contentObj  = ((content instanceof Object) ? true : false);

            this.callbacks = {
                onOpen: item.onOpen,
                onSubmit: item.onSubmit,
                onClose: item.onClose
            };

            btnOk = {
                tag:  'button#popupS-button-ok.' + this.options.baseClassName + '-button-ok' + (this.options.additionalButtonOkClass ? this.options.additionalButtonOkClass : ''),
                text: this.options.labelOk };
            btnCancel = {
                tag:  'button#popupS-button-cancel.' + this.options.baseClassName + '-button-ok' + (this.options.additionalButtonCancelClass ? this.options.additionalButtonCancelClass : ''),
                text: this.options.labelCancel };

            htmlObj = [
                { html: content },
                mode != 'modal' && mode != 'modal-ajax' && mode == 'prompt' && {
                    tag: 'form.' + this.options.baseClassName + '-form' + (this.options.additionalFormClass ? this.options.additionalFormClass : ''),
                    children: [
                        item.placeholder && { tag:     'label',
                          htmlFor: 'popupS-input',
                          text:    item.placeholder },
                        { tag:  'input#popupS-input',
                          type: 'text' }
                    ]
                },
                mode != 'modal' && mode != 'modal-ajax' && { tag: 'nav.' + this.options.baseClassName + '-buttons' + (this.options.additionalButtonHolderClass ? this.options.additionalButtonHolderClass : ''),
                  children:
                    (
                        (mode == 'prompt' || mode == 'confirm')
                            ? (!this.options.flagButtonReverse ? [btnCancel, btnOk] : [btnOk, btnCancel] )
                            : [btnOk]
                    )
                }
            ];

            content = _buildDOM({
                children:[
                    { tag: 'a#popupS-resetFocusBack.' + this.options.baseClassName + '-resetFocus',
                      href:'#',
                      text:'Reset Focus' },
                    (this.options.flagShowCloseBtn && {
                        tag: 'span#popupS-close.' + this.options.baseClassName + '-close' + (this.options.additionalCloseBtnClass ? this.options.additionalCloseBtnClass : ''),
                        html: this.options.closeBtn
                    }),
                    (title && {
                        tag:  'h5.' + this.options.baseClassName + '-title' + className,
                        text: title }),
                    { tag:      '.' + this.options.baseClassName + '-content' + className,
                      children: (contentObj && content || htmlObj) },
                    { tag:'a#popupS-resetFocus.' + this.options.baseClassName + '-resetFocus',
                      href:'#',
                      text:'Reset Focus'}
                ]
            });

            this._resetLayer();
            _appendChild(this.$layerEl.childNodes[0], content);
            this._appendPopup();
            this.$contentEl = this.$layerEl.getElementsByClassName(this.options.baseClassName + '-content')[0];

            this.$btnReset     = document.getElementById('popupS-resetFocus');
            this.$btnResetBack = document.getElementById('popupS-resetFocusBack');

            // handle reset focus link
            // this ensures that the keyboard focus does not
            // ever leave the dialog box until an action has
            // been taken
            _on(this.$btnReset, 'focus', this._resetEvent);
            _on(this.$btnResetBack, 'focus', this._resetEvent);

            // focus the first input in the layer Element
            _autoFocus(this.$layerEl);

            // make sure which buttons or input fields are defined for the EventListeners
            this.$btnOK = document.getElementById('popupS-button-ok') || undefined;
            this.$btnCancel = document.getElementById('popupS-button-cancel') || undefined;
            this.$input = document.getElementById('popupS-input') || undefined;
            if(typeof this.$btnOK !== "undefined")     _on(this.$btnOK, "click", this._okEvent);
            if(typeof this.$btnCancel !== "undefined") _on(this.$btnCancel, "click", this._cancelEvent);


            // eventlisteners for overlay and x
            if (this.options.flagShowCloseBtn)   _on(document.getElementById('popupS-close'), "click", this._cancelEvent);
            if (this.options.flagCloseByOverlay) _on(this.$overlayEl, "click", this._cancelEvent);

            // listen for keys
            if (this.options.flagCloseByEsc) _on(document.body, "keyup", this._keyEvent);

            // callback onOpen
            if(typeof this.callbacks.onOpen === "function") this.callbacks.onOpen.call(this);

        },
        _appendPopup : function(){
            // Determine the target Element and add the Element to the DOM
            this.$targetEl = this.options.appendLocation;
            _appendChild(this.$targetEl, this.$wrapEl);
            // append the element level style for overflow if the option was set.
            if ((this.$targetEl === (document.body || document.documentElement)) && this.options.flagBodyScroll === false) {
                _css(this.$targetEl, {
                    overflow: 'hidden'
                });
            }
            // after adding elements to the DOM, use computedStyle
            // to force the browser to recalc and recognize the elements
            // that we just added. This is so that our CSS Animation has a start point.
            if(window.getComputedStyle) window.getComputedStyle(this.$wrapEl, null).height;
            var classReg = function (className) {
                return new RegExp("(|\\s+)" + className + "(\\s+|$)");
            };
            // if the class *-open doesn't exists in the wrap Element append it.
            if (!(classReg(' ' + this.options.baseClassName + '-open').test(this.$wrapEl.className))) {
                this.$wrapEl.className += ' ' + this.options.baseClassName + '-open';
            }
            if (!(classReg(' ' + this.options.baseClassName + '-open').test(this.$layerEl.childNodes[0].className))) {
                this.$layerEl.childNodes[0].className += ' ' + this.options.baseClassName + '-open';
            }
        },
        _hide: function () {
            var self = this;
            // remove item from queue
            queue.splice(0,1);
            // check if last item in queue
            if (queue.length > 0) this._create();
            else{
                isOpen = false;

                var removeWrap = function() {
                    // remove the wrap element from the DOM
                    _removeElement(self.$wrapEl);
                    // remove the element level style for overflow if the option was set.
                    if ((self.$targetEl === (document.body || document.documentElement)) && self.options.flagBodyScroll === false) {
                        if (self.$targetEl.style.removeProperty) {
                            self.$targetEl.style.removeProperty('overflow');
                        } else {
                            self.$targetEl.style.removeAttribute('overflow');
                        }
                    }
                };

                var transitionDone = function(event) {
                    event.stopPropagation();
                    // unbind event so function only gets called once
                    _off(self.$wrapEl, transition.type, transitionDone);
                    // remove the Element from the DOM after Transition is Done
                    removeWrap();
                };

                var transitionDoneLayer = function(event) {
                    event.stopPropagation();
                    // unbind event so function only gets called once
                    _off(self.$layerEl, transition.type, transitionDone);
                };

                // removes the open class from the wrap & layer Element
                // and adds an EventListener to this Element
                // which removes it from the DOM after the Transition is done.

                this.$wrapEl.className = this.$wrapEl.className.replace(' ' + this.options.baseClassName + '-open', '');
                if (transition.supported){
                    _on(self.$wrapEl, transition.type, transitionDone);
                } else {
                    removeWrap();
                }
                this.$layerEl.childNodes[0].className = this.$layerEl.childNodes[0].className.replace(' ' + this.options.baseClassName + '-open', '');
                if (transition.supported) _on(self.$layerEl, transition.type, transitionDoneLayer);

            }
        },



        ///////////////
        //// Async ////
        ///////////////


        /**
         * sets the state of the loading Layer
         * and appends it to the Dom
         *
         * @param   {Bool}  state
         */
        _loading: function(state) {
            this.$loadingEl = _buildDOM({
                tag: 'div.' + this.options.baseClassName + '-loading.' + this.options.loader
            });
            if (state){
                this._resetLayer();
                _css(this.$layerEl.childNodes[0],{
                    height: '60px',
                    width: '60px',
                    borderRadius: '30px'
                });
                _appendChild(this.$layerEl.childNodes[0], this.$loadingEl);
                this._appendPopup();
            } else {
                _css(this.$layerEl.childNodes[0],{
                    height: null,
                    width: null,
                    borderRadius: null
                });
            }
        },
        /**
         * load Asynchronous Files
         * can be Images or Files via Ajax
         *
         * @param   {Object}    item
         */
        _loadContents: function(item) {
            var url = item.ajax.url,
                str = (typeof item.ajax.str != "undefined")? item.ajax.str : '',
                post = (typeof item.ajax.post != "undefined")? item.ajax.post : true,
                self = this;

            // Match image file
            if (url.match(R_IMG)) {//.exec(url) !== null
                // Create the image Element, not visible
                var imgElement = _buildDOM({
                    children: {
                        tag :   'img',
                        src :   url
                    }
                });
                this._loading(true);
                this._preLoadImage(imgElement, function(){
                    self._loading(false);
                    item.content = imgElement;
                    self._createPopup(item);
                });
            } else {
                // get url via ajax
                this._ajax(url, str, post, function(e){
                    // turn the result in a HTMLElement
                    var ajaxElement = _buildDOM({
                        html: this
                    });
                    // check if the newly created HTMLElement got any Images within it.
                    self._preLoadImage(ajaxElement, function(){
                        self._loading(false);
                        item.content = ajaxElement;
                        self._createPopup(item);
                    });
                }, function(){
                    //before Sending
                    self._loading(true);
                });
            }
        },
        _preLoadImage : function(parentNode, callback) {
            var items = _getElementsByTagName(parentNode, 'img');
            var i = items.length;
            var queue = i;
            var img;
            var self = this;

            while (i--){
                img = items[i];
                //in case the're already cached by the browser decrement queue
                if(img.complete) {
                    queue--;
                } else {
                    _on(img, 'load', complete);
                    _on(img, 'error', complete);
                }
            }
            //in case the're already cached by the browser
            !queue && complete();

            var complete = function(){
                if(--queue <= 0){
                    i = items.length;
                    while(i--){
                        img = items[i];
                        _off(img, 'load', complete);
                        _off(img, 'error', complete);
                    }
                    callback();
                }
            };
        },
        /**
         * ajax request
         * with callback and beforeSend
         *
         * @param   {String}    filename
         * @param   {String}    str
         * @param   {Bool}      post
         * @param   {Function}  callback
         * @param   {Function}  beforeSend
         */
        _ajax: function(filename, str, post, callback, beforeSend) {
            var ajax;
            if (window.XMLHttpRequest){
                ajax = new XMLHttpRequest();//IE7+, Firefox, Chrome, Opera, Safari
            } else if (ActiveXObject("Microsoft.XMLHTTP")){
                ajax = new ActiveXObject("Microsoft.XMLHTTP");//IE6/5
            }else if (ActiveXObject("Msxml2.XMLHTTP")){
                ajax = new ActiveXObject("Msxml2.XMLHTTP");//other
            }else{
                alert("Error: Your browser does not support AJAX.");
                return false;
            }
            ajax.onreadystatechange=function(){
                if (ajax.readyState == 4 && ajax.status == 200){
                    if (callback) callback.call(ajax.responseText);
                }
            };
            if(post === false) {
                ajax.open("GET", filename + str, true);
                ajax.send(null);
            } else {
                ajax.open("POST", filename, true);
                ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                ajax.send(str);
            }
            if(beforeSend) beforeSend.call();
            return ajax;
        },



        ////////////////
        //// Events ////
        ////////////////



        //ok event handler
        _okEvent: function(event) {
            // preventDefault
            if (typeof event.preventDefault !== "undefined") event.preventDefault();
            // call the callback onSubmit if one is defined. this references to _popupS
            if(typeof this.callbacks.onSubmit === "function") {
                if(typeof this.$input !== "undefined") {
                    this.callbacks.onSubmit.call(this, this.$input.value);
                } else {
                    this.callbacks.onSubmit.call(this);
                }
            }
            // hide popup and detach event handlers
            this._commonEvent();
        },
        // cancel event handler
        _cancelEvent: function(event) {
            if (typeof event.preventDefault !== "undefined") event.preventDefault();
            // call the callback onClose if one is defined. this references to _popupS
            if(typeof this.callbacks.onClose === "function") {
                this.callbacks.onClose.call(this);
            }
            this._commonEvent();
        },
        // common event handler (keyup, ok and cancel)
        _commonEvent: function() {
            // remove event handlers
            if(typeof this.$btnOK !== "undefined")     _off(this.$btnOK, "click", this._okEvent);
            if(typeof this.$btnCancel !== "undefined") _off(this.$btnCancel, "click", this._cancelEvent);
            if (this.options.flagShowCloseBtn)   _off(document.getElementById('popupS-close'), "click", this._cancelEvent);
            if (this.options.flagCloseByOverlay) _off(this.$overlayEl, "click", this._cancelEvent);
            if (this.options.flagCloseByEsc)     _off(document.body, "keyup", this._keyEvent);

            this._hide();
        },
        // reset focus to first item in the popup
        _resetEvent: function(event) {
            _autoFocus(this.$layerEl);
        },
        // keyEvent Listener for Enter and Escape
        _keyEvent: function(event) {
            var keyCode = event.keyCode;
            if(typeof this.$input !== "undefined" && keyCode === 13) this._okEvent(event);
            if(keyCode === 27) this._cancelEvent(event);
        },

    }

    /**
     * context binding
     * @param   {Function}  ctx     context
     * @param   {Function}  fn      function
     */
    function _bind(ctx, fn) {
        var args = [].slice.call(arguments, 2);
        return  fn.bind ? fn.bind.apply(fn, [ctx].concat(args)) : function () {
            return fn.apply(ctx, args.concat([].slice.call(arguments)));
        };
    }
    /**
     * Object iterator
     *
     * @param  {Object|Array}  obj
     * @param  {Function}      iterator
     */
    function _each(obj, iterator) {
        if (obj) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    iterator(obj[key], key, obj);
                }
            }
        }
    }
    /**
     * Copy all of the properties in the source objects over to the destination object
     *
     * @param   {...Object}     out
     *
     * @return  {Object}
     */
    function _extend(out) {
        out = out || {};

        for (var i = 1; i < arguments.length; i++) {
            if (!arguments[i])
                continue;

            for (var key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key))
                    out[key] = arguments[i][key];
            }
        }

        return out;
    }
    /**
     * Bind events to elements
     *
     * @param  {HTMLElement}    el
     * @param  {Event}          event
     * @param  {Function}       fn
     */
    function _on(el, event, fn) {
        if (typeof el.addEventListener === "function") {
            el.addEventListener(event, fn, false);
        } else if (el.attachEvent) {
            el.attachEvent("on" + event, fn);
        }
    }
    /**
     * Unbind events from element
     *
     * @param  {HTMLElement}    el
     * @param  {Event}          event
     * @param  {Function}       fn
     */
    function _off(el, event, fn) {
        if (typeof el.removeEventListener === "function") {
            el.removeEventListener(event, fn, false);
        } else if (el.detachEvent) {
            el.detachEvent("on" + event, fn);
        }
    }
    /**
     * css recursion
     *
     * @param   {HTMLElement}   el
     * @param   {Object|String} prop
     * @param   {String}        [val]
     */
    function _css(el, prop, val) {
        if (el && el.style && prop) {
            if (prop instanceof Object) {
                for (var name in prop) {
                    _css(el, name, prop[name]);
                }
            } else {
                el.style[prop] = val;
            }
        }
    }
    /**
     * Selector RegExp
     *
     * @const   {RegExp}
     */
    // orig: /^(\w+)?(#\w+)?((?:\.[\w_-]+)*)/i;
    var R_SELECTOR = /^(\w+)?(#[\w_-]+)?((?:\.[\w_-]+)*)/i;

    /**
     * build DOM Nodes
     *
     * @example
     *  _buildDOM({
     *      tag:'div#id.class.class2',
     *      css:{
     *          opacity:'1',
     *          width:'100px'
     *      },
     *      text:'test',
     *      html:'<p>Hello</p>',
     *      children:[{
     *          tag:'div#id_child.class.class2',
     *          css:{opacity:'1', height:'200px'},
     *          text:'test',
     *          html:'<p>World</p>'
     *      }]
     *  });
     *
     * @param   {String|Object} spec
     *
     * @return  {HTMLElement}
     */
    function _buildDOM(spec) {
        // Spec Defaults
        if (spec === null) {
            spec = 'div';
        }
        if (typeof spec === 'string') {
            spec = {
                tag: spec
            };
        }
        var el, classSelector;
        var fragment = document.createDocumentFragment();
        var children = spec.children;
        var selector = R_SELECTOR.exec(spec.tag || '');

        delete spec.children;

        spec.tag = selector[1] || 'div';
        spec.id = spec.id || (selector[2] || '').substr(1);
        // split ClassNames
        classSelector = (selector[3] || '').split('.');
        classSelector[0] = (spec.className || '');
        spec.className = classSelector.join(' ');


        el = document.createElement(spec.tag);
        _appendChild(fragment, el);
        delete spec.tag;

        // For every
        // key => spec[key];
        _each(spec, function(value, key) {
            if (key === 'css') {
                _css(el, spec.css);
            } else if (key === 'text') {
                (value !== null) && _appendChild(el, document.createTextNode(value));
            } else if (key === 'html') {
                (value !== null) && (el.innerHTML = value);
            } else if (key in el) {
                try {
                    el[key] = value;
                } catch (e) {
                    el.setAttribute(key, value);
                }
            } else if (/^data-/.test(key)) {
                el.setAttribute(key, value);
            }
        });
        // if the children is already an HTML Element, append it to el
        if (children && children.appendChild) {
            _appendChild(el, children);
        } else if (children) {
            if (children instanceof Array) {
                _each(children, function(value, key) {
                    if(value instanceof Object) {
                        _appendChild(el, _buildDOM(value));
                    }
                });
            } else if (children instanceof Object) {
                _appendChild(el, _buildDOM(children));
            }
        }
        return el;
    }
    /**
     * appendChild
     *
     * @param   {HTMLElement}   parent
     * @param   {HTMLElement}   el
     */
    function _appendChild(parent, el) {
        try {
            parent && el && parent.appendChild(el);
        } catch (e) {}
    }
    /**
     * Focus First Item in Parent Node
     * submit > text,password > button
     *
     * @param  {HTMLElement}    parentNode
     */
    function _autoFocus(parentNode) {
        var items = _getElementsByTagName(parentNode, 'input');
        var i = 0;
        var n = items.length;
        var el, element;

        for (; i < n; i++) {
            el = items[i];

            if (el.type === 'submit') {
                !element && (element = el);
            } else if (!/hidden|check|radio/.test(el.type) && el.value === '') {
                element = el;
                break;
            }
        }

        if (!element) {
            element = _getElementsByTagName(parentNode, 'button')[0];
        }

        try {
            element.focus();
        } catch (err) {}
    }
    /**
     * get Elements with Tag () from Parent
     *
     * @param   {HTMLElement}  el
     * @param   {String}       name
     *
     * @return  {NodeList}
     */
    function _getElementsByTagName(el, name) {
        return el.getElementsByTagName(name);
    }
    /**
     * remove Element from Parent
     *
     * @param   {HTMLElement}   el
     */
    function _removeElement(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    // Instantiate a PopupS Object
    var popupS = new PopupS();

    // Public methods
    popupS.window = function(params) {
        this._open(params);
    };
    popupS.alert = function(params) {
        params = _extend(params, {mode: 'alert'});
        this._open(params);
    };
    popupS.confirm = function(params) {
        params = _extend(params, {mode: 'confirm'});
        this._open(params);
    };
    popupS.prompt = function(params) {
        params = _extend(params, {mode: 'prompt'});
        this._open(params);
    };
    popupS.modal = function(params) {
        params = _extend(params, {mode: 'modal'});
        this._open(params);
    };
    popupS.ajax = function(params) {
        params = _extend(params, {mode: 'modal-ajax'});
        this._open(params);
    };

    // Export
    return popupS;
}));
},{}],2:[function(require,module,exports){
'use strict';

// liveFrames is a temporary name/status for currently recorded frames.
// ref frames refers to either the updated ref (liveFrames -> refFrames) OR one from database
// recentFrames refers to practice exercise 'stop' page (liveFrames -> recentFrames)
let liveFrames, refFrames, recentFrames;
let req, db;
let dataForCntReps = {};
//let refStart, refEnd; //not used
let repEvals = [];
let liveBodyColor="#7BE39F";
let commonBlue = "#1E89FB";
let refJointColor = "#FF6786";
const popupS = require('popups');
window.actionBtn = false;

window.onbeforeunload = (e) => {
  if (window.actionBtn) {
    return;
  }

  if(confirm('Are you sure you want to quit? Incomplete session data will be lost.')) {
    return;
  }
  else {
    return false;
  }
}

$('.actionBtn').click(function() {
  window.actionBtn = true;
})

function parseURL(url)
{

  let exerciseId = null;
  let patientId = null;
  let mode = null;
  let type = null;
  const urlToArray = url.split('/');

  mode = urlToArray[3];
  type = urlToArray[4];
  //logged-in user is a clinician
  if (urlToArray.length === 7) {
    exerciseId = urlToArray[5];
    patientId = urlToArray[6];
  }
  //logged-in user is a patient
  else if (urlToArray.length === 6) {
    exerciseId = urlToArray.pop();
    patientId = null;
  }
  return {
    mode: mode,
    patientId: patientId,
    exerciseId: exerciseId,
    type: type
  };
}

function action(nextMode, type) {
  openDB(function() {
    const parsedURL = parseURL(window.location.pathname);
    var patientId = parsedURL.patientId;
    var exerciseId = parsedURL.exerciseId;

    function redirect() {
      var redirectToUrl = '/userexercise/session/' + nextMode + '/' + type + '/' + exerciseId + '/';
      window.location = (!parsedURL.patientId) ? redirectToUrl : redirectToUrl + patientId;
    }

    //This condition describes the end of an update or create reference.
    //The refFrames data in local storage gets set to the most recent frames.
    if(nextMode === 'stop' && type === 'reference') {
        let ref_ed = new Date().getTime();
        localStorage.setItem("refEnd", ref_ed);
        let updatedRef = {type: 'refFrames', body: liveFrames};
        let bodyFramesStore = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames');
        let request = bodyFramesStore.put(updatedRef);
        request.onsuccess = function(event) {
          redirect();
        }
    }

    //"Discard Reference Recording"
    else if(nextMode === 'start' && type === 'reference') {
      //hacky delete
      let deleteref = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames').put({type: 'refFrames', body: []});
      deleteref.onsuccess = function(e) {
        redirect();
      }
    }

    //End of doing a practice session. Live Frames get saved temporarily to indexedDB
    else if(nextMode === 'stop' && type === 'practice') {
      let request = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames').put({type: 'liveFrames', body: liveFrames});
      request.onsuccess = function(e) {
        redirect();
      }
    }
    //"Discard Practice Recording"
    else if(nextMode === 'start' && type === 'practice') {
      let deleterecent = db.transaction(['bodyFrames'], 'readwrite').objectStore('bodyFrames').delete('liveFrames');
      deleterecent.onsuccess = function(e) {
        redirect();
      }
    }
    else {
      redirect();
    }
  });
}

// helper function for calculating the refMax, refMin
// axis is either 'depthX' or 'depthY'
function getMinMax_joint(joint, array, axis) {
  let out = [];
  array.forEach(function(el) {
    return out.push.apply(out, [el.joints[joint][axis]]);
  }, []);
  return { min: Math.min.apply(null, out), max: Math.max.apply(null, out) };
}

// assuming the save button is clicked by someone else
function saveReference() {

  const pathToArray = window.location.pathname.split('/');
  const exerciseId = pathToArray[5];
  const patientId = pathToArray[6];
  const redirectToUrl = '/userexercise/setting/' + exerciseId +'/' + patientId;

  let values = {};
  // save to referenceExercise
  values.bodyFrames = JSON.stringify(refFrames);
  let mm = getMinMax_joint(dataForCntReps.joint, refFrames, dataForCntReps.axis);
  values.refMin = mm.min;
  values.refMax = mm.max;
  values.neck2spineBase = refFrames[0].joints[0]["depthY"] - refFrames[0].joints[2]["depthY"];
  values.shoulder2shoulder = refFrames[0].joints[8]["depthX"] - refFrames[0].joints[4]["depthX"];
  let ed = localStorage.getItem("refEnd");
  let st = localStorage.getItem("refStart");
  localStorage.removeItem("refEnd");
  localStorage.removeItem("refStart");
  values.refTime = Math.round((ed - st) / 1000);
  console.log(values.refTime);
  // save also to dataForCntReps
  dataForCntReps.refTime = values.refTime;
  dataForCntReps.bodyHeight = values.neck2spineBase;
  dataForCntReps.bodyWidth = values.shoulder2shoulder;
  dataForCntReps.jointNeck = refFrames[0].joints[2];

  $.ajax({
    type: 'PUT',
    url: 'api/userexercise/reference/mostrecent/data/' + exerciseId + '/' + patientId,
    data: values,
    success: function (result) {
      window.location = redirectToUrl
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}


function showFeedback(accuracy, speed) {
  let speedProgress = Math.round(speed * 100);
  let accuracyProgress = Math.round(accuracy * 100);
  //console.log(speedProgress + "\t" + accuracyProgress);
  let accColor;
  //setting accuracy progress bar color based on patient performance
  if(accuracyProgress >= 70){
    accColor = '#23D160'
  }
  else if(accuracyProgress >= 45){
    accColor = '#ffdf71'
  }
  else{
    accColor = '#FF3860'
  }
  var speedColor;
  //setting speed progress bar color based on patient speed
  if(speedProgress >= 70){
    speedColor = '#23D160'
  }
  else if(speedProgress > 45){
    speedColor = '#ffdf71'
  }
  else{
    speedColor = '#FF3860'
  }
  // Get the modal
  var modal = document.getElementById('fdbkModal');
  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];
  // Open Modal
  modal.style.display = "block";
  // Close Modal
  span.onclick = function() {
    modal.style.display = "none";
  }
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
  //chart data
  $(modal).ready(function () {
    var pieData = [
      {
        value : accuracyProgress,
        color: accColor
      },
      {
        value: 100 - accuracyProgress,
        color:"#e6e6e6"
      }
    ];
    var pieData2 = [
      {
        value : speedProgress,
        color: speedColor
      },
      {
        value: 100 - speedProgress,
        color:"#e6e6e6"
      }
    ];
    var myPie = new Chart(document.getElementById("accuracy-chart-container").getContext("2d")).Doughnut(pieData,{
      //how thick progress bar is for accuracy chart
      percentageInnerCutout : 85,
    });
    var myPie2 = new Chart(document.getElementById("speed-chart-container").getContext("2d")).Doughnut(pieData2,{
      //how thick progress bar is for speed chart
      percentageInnerCutout : 85,
      //add text in chart
      onAnimationComplete: addText
    });
    //add text in chart
    function addText() {
      var speedCanvas = document.getElementById("speed-chart-container");
      var ctx = document.getElementById("speed-chart-container").getContext("2d");
      var speedLocX = speedCanvas.width / 3.5;
      var speedLocY = speedCanvas.height / 3.35;
      var cx = speedCanvas.width / 2.5;
      var cy = speedCanvas.height / 3;
      var timerLocX = speedCanvas.width / 10;
      var timerLocY = speedCanvas.height / 5;
      var accuracyCanvas = document.getElementById("accuracy-chart-container");
      var ctx2 = document.getElementById("accuracy-chart-container").getContext("2d");
      var checkLocX = accuracyCanvas.width / 6;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = '30px Open Sans';
      ctx.fillStyle = '#428BCA';
      ctx.fillText(sessionSpeed, speedLocX, speedLocY);
      ctx.font = '14px Open Sans';
      ctx.fillText( "seconds per repition", cx, cy);
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'bottom';
      ctx2.font = '30px Open Sans';
      ctx2.fillStyle = '#428BCA';
      ctx2.fillText( accuracyProgress + "%", cx, speedLocY);
      ctx.font = "900 100px fontAwesome";
      ctx.fillText(timer, timerLocX, speedLocY);
      ctx2.font = "900 100px fontAwesome";
      ctx2.fillText(accuracyCheck, checkLocX, speedLocY);
    }
  });
}


function savePractice() {
  const parsedURL = parseURL(window.location.pathname);
  let patientId = parsedURL.patientId;
  let exerciseId = parsedURL.exerciseId;
  let url ='/api/userexercise/practice/mostrecent/data/' + exerciseId + '/';
  let isComplete = false;
  let values = {};
  values.bodyFrames = JSON.stringify(recentFrames);

  // if no good repitition detected
  values.repEvals = localStorage.getItem("repEvals");
  if(!values.repEvals) {
    values.repEvals=JSON.stringify([{"speed": -1}]);
  }
  console.log(values.repEvals);
  localStorage.removeItem("repEvals");

  // logged-in user is clinician
  if (patientId) {
    url = url + patientId;
  }
  if(setNumber === numSets) {
    values.weekEnd = new Date().getWeekNumber();
    isComplete = true;
  }

  // variables for feedback
  popupS.alert({
    content: 'Hello World!'
  });
  let ifSuccess = false;
  let acc;
  let spd;
  $.ajax({
    type: 'PUT',
    url: url,
    data: values,
    success: function (result) {
      acc = result.accuracy;
      spd = result.speed;
      console.log(acc, spd);
      ifSuccess = true;
      let msg = JSON.stringify(result);
      popupS.alert({
        content: 'Hello World!'
      });
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }

    // if(ifSuccess) {
    //   // Modal popup for analysis
    //   // showFeedback(acc, spd);
    //   // Get the modal for popup
    //   let modal = document.getElementById('fdbkModal');
    //   // Get the <span> element that closes the modal
    //   let span = document.getElementsByClassName("close")[0];
    //   modal.style.display = "block";
    //   // When the user clicks on <span> (x), close the modal
    //   span.onclick = function() {
    //     modal.style.display = "none";
    //   };
    //   // When the user clicks anywhere outside of the modal, close it
    //   window.onclick = function(event) {
    //     if (event.target === modal) {
    //       modal.style.display = "none";
    //     }
    //   };
    //
    //   if(isComplete) {
    //     window.location = 'userexercise/session/end/practice/' +
    //       exerciseId + '/' + patientId;
    //   } else {
    //     window.location = 'userexercise/session/start/practice/' +
    //       exerciseId + '/' + patientId;
    //   }
    //
    // }
  })
}

function goTodashBoard() {
  window.location = 'dashboard';
}

function goToExercises() {

  const patientId = window.location .pathname.split('/').pop();
  window.location = 'clinician/patientexercises/' + patientId;
}

(function ()
{
  let processing, canvas, ctx, ref_canvas, ref_ctx, exe_canvas, exe_ctx;
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
  //canvas dimension
  let width = 0;
  let height = 0;
  let radius=9; //radius of joint circle
  let circle_radius = 30//radius of calibration circle
  let jointType = [7,6,5,4,2,8,9,10,11,10,9,8,2,3,2,1,0,12,13,14,15,14,13,12,0,16,17,18,19];//re visit and draw in a line
  let notAligned = true; // whether person has aligned in circle for the first time or not
  let useTimer = true; // whether or not to use the startTimer() function
  // index of reference frame
  let ref_index = 0;
  // index of exercise frame
  let exe_index = 0;
  let parsedURL = parseURL(window.location.pathname);

  // value for countReps
  let nx_1stFrame, ny_1stFrame, nz_1stFrame; // neck position
  let bodyWidth; // shoulderLeft to shoulderRight
  let bodyHeight; // neck to spineBase
  let threshold_flag, direction;
  // fetch data before start exercise
  let url = '/api/userexercise/dataforcount/' + parsedURL.exerciseId + '/';
  (!parsedURL.patientId) ? url = url: url = url + parsedURL.patientId;
  $.get(url, function(data){
    dataForCntReps = data;
    //group: (down, L2R) + and (up, R2L) -
    if(dataForCntReps.direction === 'L2R') {
      direction = "down";
      threshold_flag = "down";
    } else if (dataForCntReps.direction === 'R2L') {
      direction = "up";
      threshold_flag = "up";
    } else {
      direction = dataForCntReps.direction;
      threshold_flag = dataForCntReps.direction;
    }
  });

  // time pt for speed evaluation
  let st, ed;

  if (isElectron())
  {
    document.addEventListener('DOMContentLoaded', function() {
      processing = false;
      //live canvas
      canvas = document.getElementById('outputCanvas');
      ctx = canvas.getContext('2d');
      drawGrids(ctx);
      drawFloorPlane(ctx);
      //reference canvas
      ref_canvas = document.getElementById('refCanvas');
      ref_ctx = ref_canvas.getContext('2d');
      drawGrids(ref_ctx);
      drawFloorPlane(ref_ctx);
      //exercise canvas
      exe_canvas = document.getElementById('exeCanvas');
      exe_ctx = exe_canvas.getContext('2d');
      drawGrids(exe_ctx);
      drawFloorPlane(exe_ctx);

      //get the canvas dimension
      width = canvas.width;
      height = canvas.height;
      liveFrames = [];
      localStorage.setItem('canStartRecording', false);

      openDB(function() {
        let getref = db.transaction(['bodyFrames']).objectStore('bodyFrames').get('refFrames');
        getref.onsuccess = function(e) {
          if(getref.result) {
            refFrames = getref.result.body; //CHECk WHAT refFRAMES IS on the start page of "recording new reference"
            console.log("refFrames loaded locally");
          }
          showCanvas();
          console.log("show canvas called after getting referenceFrames");
        }

        let getrecent = db.transaction(['bodyFrames']).objectStore('bodyFrames').get('liveFrames');
        getrecent.onsuccess = function(e) {
          if(getrecent.result) {
            recentFrames = getrecent.result.body;
          }
        }
      });
      window.Bridge.eStartKinect();
    });
  }

  // the function that controls the canvas hiding/displaying logic
  // we determine the state of the website by parsing URL
  // we also reset the reference counter whenever we transit to a new state
  function showCanvas()
  {
    let refCanvas = document.getElementById("refCanvas");
    let exeCanvas = document.getElementById("exeCanvas");
    let outputCanvas = document.getElementById("outputCanvas");

    //start of creating reference
    if(parsedURL.mode === 'start' && refFrames.length === 0)
    {
      ref_index = 0;
      exe_index = 0;
      //nothing should be shown
      // document.getElementById("refCanvas").style.display = "none";
      // document.getElementById("exeCanvas").style.display = "none";
      // document.getElementById("outputCanvas").style.display = "none";
      refCanvas.style.display = "none";
      exeCanvas.style.display = "none";
      outputCanvas.style.display = "none";
    }
    // start of updating reference and practice
    else if((parsedURL.mode === 'start' || parsedURL.mode === 'end') && refFrames)
    {
      ref_index = 0;
      exe_index = 0;
      //show reference canvas only
      // document.getElementById("refCanvas").style.display = "block";
      // document.getElementById("exeCanvas").style.display = "none";
      // document.getElementById("outputCanvas").style.display = "none";
      refCanvas.style.display = "block";
      exeCanvas.style.display = "none";
      outputCanvas.style.display = "none";
      let ctx = refCanvas.getContext('2d');
      drawGrids(ctx);
      drawFloorPlane(ctx);

    }
    //play state for updating reference and creating reference
    else if(parsedURL.mode === 'play' && parsedURL.type === 'reference')
    {
      ref_index = 0;
      exe_index = 0;
      //show live canvas only
      // document.getElementById("refCanvas").style.display = "none";
      // document.getElementById("exeCanvas").style.display = "none";
      // document.getElementById("outputCanvas").style.display = "block";
      refCanvas.style.display = "none";
      exeCanvas.style.display = "none";
      outputCanvas.style.display = "block";
      let ctx = outputCanvas.getContext('2d');
      drawGrids(ctx);
      drawFloorPlane(ctx);
    }
    //play state for practice
    else if(parsedURL.mode === 'play' && parsedURL.type === 'practice')
    {
      ref_index = 0;
      exe_index = 0;
      //show live canvas and reference canvas
      // document.getElementById("refCanvas").style.display = "inline";
      // document.getElementById("exeCanvas").style.display = "none";
      // document.getElementById("outputCanvas").style.display = "inline";
      refCanvas.style.display = "inline";
      exeCanvas.style.display = "none";
      outputCanvas.style.display = "inline";
      let ctx1 = refCanvas.getContext('2d');
      drawGrids(ctx1);
      drawFloorPlane(ctx1);
      let ctx2 = outputCanvas.getContext('2d');
      drawGrids(ctx2);
      drawFloorPlane(ctx2);

    }
    //stop state for updating reference and creating reference
    else if(parsedURL.mode === 'stop' && parsedURL.type === 'reference')
    {
      ref_index = 0;
      exe_index = 0;
      //show reference canvas
      // document.getElementById("refCanvas").style.display = "block";
      // document.getElementById("exeCanvas").style.display = "none";
      // document.getElementById("outputCanvas").style.display = "none";
      refCanvas.style.display = "block";
      exeCanvas.style.display = "none";
      outputCanvas.style.display = "none";
      let ctx = refCanvas.getContext('2d');
      drawGrids(ctx);
      drawFloorPlane(ctx);

    }
    //stop state for exercise
    else if(parsedURL.mode === 'stop' && parsedURL.type === 'practice')
    {
      ref_index = 0;
      exe_index = 0;
      //show reference and exercise canvas
      // document.getElementById("refCanvas").style.display = "inline";
      // document.getElementById("exeCanvas").style.display = "inline";
      // document.getElementById("outputCanvas").style.display = "none";
      refCanvas.style.display = "inline";
      exeCanvas.style.display = "inline";
      outputCanvas.style.display = "none";
      let ctx1 = refCanvas.getContext('2d');
      drawGrids(ctx1);
      drawFloorPlane(ctx1);
      let ctx2 = exeCanvas.getContext('2d');
      drawGrids(ctx2);
      drawFloorPlane(ctx2);
    }
    //this case is used for error safety, should not be called normally
    else
    {
      ref_index = 0;
      exe_index = 0;
      console.log("State error occurs!");
    }
  }

  function drawGrids(ctx){
    // grid
    let bw = 500; // canvas.width
    let bh = 500; // canvas.height
    let p = -0.5; // padding
    let count = 0;
    ctx.beginPath();
    for (let x = 0; x <= bh; x += 100.3) {
        ctx.moveTo(p, x + p);
        ctx.lineTo(bw + p, x + p);
    }
    ctx.lineWidth=0.5;
    ctx.strokeStyle = "#525B74";
    ctx.stroke();
    ctx.closePath();
  }

  function drawFloorPlane(ctx) {
    ctx.strokeStyle = "none";
    ctx.fillStyle = '#F0F0F2';
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(100, 406);
    ctx.lineTo(400, 406);
    ctx.lineTo(500, 500);
    ctx.fill();

  }


  function startTimer() {
    let start = Date.now();
    let timer = setInterval(function () {
      let delta = Date.now() - start;
      let time = window.CONFIG.TIMER_MAX - Math.floor(delta / 1000);
      if (time <= 0) {
        clearInterval(timer);
        $("#timerStart").attr("class", "greenColor large");
        $("#timerStart").text("Now Recording...");
        $("#num").text("");
        localStorage.setItem('canStartRecording', true);
        notAligned = false;
        let event = new Event('timer-done');
        document.dispatchEvent(event);
      } else {
        $("#timerStart").text("Recording will begin in...");
        $("#num").text(time);
      }
    }, 100);
  }

  //function that draws the body skeleton
  function drawBody(parameters, ctx, color, jointColor, drawCircle = true){

    let body = parameters;
    jointType.forEach(function(jointType){
      drawJoints({cx: body.joints[jointType].depthX * width, cy: body.joints[jointType].depthY * height},ctx, jointColor);
    });
    if(drawCircle)
    {
      drawCenterCircle({
        x: width / 2, y: 200, r: circle_radius, nx: body.joints[2].depthX * width, ny: body.joints[2].depthY * height
      },ctx);
    }
    //connect all the joints with the order defined in jointType

    ctx.beginPath();
    ctx.moveTo(body.joints[7].depthX * width, body.joints[7].depthY * height);
    jointType.forEach(function(jointType){
      ctx.lineTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
//      ctx.shadowColor = "red";
//      ctx.shadowOffsetX = 2;
//      ctx.shadowOffsetY = 4;
//      ctx.shadowBlur = 8;
      ctx.moveTo(body.joints[jointType].depthX * width, body.joints[jointType].depthY * height);
    });

    ctx.lineWidth=8;
    ctx.strokeStyle=color;
    ctx.stroke();
    ctx.closePath();
  }

  //function that draws each joint as a yellow round dot
  function drawJoints(parameters, ctx, color){

    let cx = parameters.cx;
    let cy = parameters.cy;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI*2); //radius is a global variable defined at the beginning
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  //function that draws the red Center Circle in ctx1 (canvasSKLT)
  function drawCenterCircle (parameters, ctx){

    //coordinate of the red circle
    let x = parameters.x;
    let y = parameters.y;
    //radius
    let r = parameters.r;
    //
    let neck_x = parameters.nx;
    let neck_y = parameters.ny;
    ctx.beginPath();
    //euclidean distance from head to calibration circle
    let dist = Math.sqrt(Math.pow((neck_x - x),2) + Math.pow((neck_y - y), 2))
    if(notAligned) {
      if(dist <= r){
        //When person's neck enters green circle && mode is 'play', recording will start.
        ctx.strokeStyle="Lime";
        let parsedURL = parseURL(window.location.pathname);
        if(parsedURL.mode === 'play' && useTimer) {
          startTimer();
          useTimer = false;
        }
      }
      else {
        ctx.strokeStyle="red";
      }
    }
    else {
      ctx.strokeStyle="DimGray"; // circle turns into a dark grey color once countdown finishes
    }
    ctx.lineWidth = 10;
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.closePath();
    //ctx.strokeStyle="black";
  }

  //function that counts repetitions
  // function countReps(body, threshold_flag, range_scale, top_thresh, bottom_thresh) {
  //
  //   let reps = 0;
  //   let norm, ref_norm;
  //   // This is set when user is correctly positioned in circle
  //   // neck: 2
  //   if (dataForCntReps.axis == 'depthY') {
  //     ref_norm = dataForCntReps.neckY;
  //     norm = ny_1stFrame;
  //   } else if (dataForCntReps.axis == 'depthX') {
  //     ref_norm = dataForCntReps.neckX;
  //     norm = nx_1stFrame;
  //   }
  //
  //   // Normalize reference points to neck
  //   let ref_lower_joint = dataForCntReps.refLowerJointPos - ref_norm;
  //   let ref_upper_joint = dataForCntReps.refUpperJointPos - ref_norm;
  //   //let range = (ref_lower_joint - ref_upper_joint) * range_scale;
  //
  //   let ref_max = dataForCntReps.refMax - ref_norm;
  //   let ref_min = dataForCntReps.refMin - ref_norm;// only increase reps when moving against the exercise direction:
  //
  //   let range = (ref_max - ref_min) * range_scale;
  //
  //   // Normalize current point by range and current neck value
  //   let current_pt = (body.joints[dataForCntReps.joint][dataForCntReps.axis] - norm - ref_min) / range;
  //
  //   // direction group: (down, right), (up, left)
  //   if ((threshold_flag === 'up') && (current_pt < top_thresh)) {
  //     // goes up and pass the top_thresh
  //     // // only increase reps when moving against the exercise direction:
  //     // if (threshold_flag !== direction && isBodyInPlane(nz_1stFrame, body.joints[2].cameraZ)) {
  //     //   reps++;
  //     // }
  //     // only increase reps when moving in the same direction as defined in the exercise:
  //     if (threshold_flag === direction && isBodyInPlane(nz_1stFrame, body.joints[2].cameraZ)) {
  //       reps++;
  //     }
  //     return [reps, 'down'];
  //   } else if ((threshold_flag === 'down') && (current_pt > bottom_thresh)) {
  //     // goes down and pass the bottom_thresh
  //     // // only increase reps when moving against the exercise direction:
  //     // if (threshold_flag !== direction && isBodyInPlane(nz_1stFrame, body.joints[2].cameraZ)) {
  //     //   reps++;
  //     // }
  //     // only increase reps when moving in the same direction as defined in the exercise:
  //     if (threshold_flag === direction && isBodyInPlane(nz_1stFrame, body.joints[2].cameraZ)) {
  //       reps++;
  //     }
  //     return [reps, 'up'];
  //   } else {
  //     // console.log("No flip");
  //     return [reps, threshold_flag];
  //   }
  // }

  /*
   * diff_level = {(easy:0.5), (normal:0.75), (hard:0.9)}
   * base_thresh = 0.25
   */
  function countReps(body, threshold_flag, diff_level, base_thresh) {

    let reps = 0;
    let norm, ref_norm; // the position of the joint-for-norm
    let d, ref_d; // the distance to the joint-for-norm in the corresponding axis
    // This is set when user is correctly positioned in circle
    // neck: 2
    if (dataForCntReps.axis == 'depthY') {
      ref_norm = dataForCntReps.jointNeck['depthY'];
      norm = ny_1stFrame;
      ref_d = dataForCntReps.bodyHeight;
      d = bodyHeight;
    } else if (dataForCntReps.axis == 'depthX') {
      //should be close to leftShoulderX
      ref_norm = dataForCntReps.jointNeck['depthX'] - dataForCntReps.bodyWidth / 2;
      norm = nx_1stFrame - bodyWidth / 2;
      ref_d = dataForCntReps.bodyWidth;
      d = bodyWidth;
    }

    let currR = ref_d / d * (body.joints[dataForCntReps.joint][dataForCntReps.axis] - norm) + ref_norm;
    console.log("ref_d: " + ref_d);
    console.log("ref_norm: " + ref_norm);
    console.log("d: " + d);
    console.log("norm: " + norm);
    console.log("currR: " + currR);

    let ref_min = dataForCntReps.refMin; //upper
    let ref_max = dataForCntReps.refMax; //lower
    let range = ref_max - ref_min;
    let top_thresh, bottom_thresh;
    console.log("ref_min, ref_max: " + ref_min + "\t" + ref_max);
    if (direction === 'up') {
      top_thresh = ref_min + range * (1-diff_level);
      bottom_thresh = ref_max - range * base_thresh;
    } else if (direction === 'down') {
      top_thresh = ref_min + range * base_thresh;
      bottom_thresh = ref_max - range * (1-diff_level);
    }
    console.log("top_thresh: " + top_thresh);
    console.log("bottom_thresh: " + bottom_thresh);
    // direction group: (down, right), (up, left)
    if ((threshold_flag === 'up') && (currR < top_thresh)) {
      // goes up and pass the top_thresh
      // only increase reps when moving in the same direction as defined in the exercise:
      if (threshold_flag === direction && isBodyInPlane(nz_1stFrame, body.joints[2].cameraZ)) {
        reps++;
      }
      return [reps, 'down'];
    } else if ((threshold_flag === 'down') && (currR > bottom_thresh)) {
      // goes down and pass the bottom_thresh
      // only increase reps when moving in the same direction as defined in the exercise:
      if (threshold_flag === direction && isBodyInPlane(nz_1stFrame, body.joints[2].cameraZ)) {
        reps++;
      }
      return [reps, 'up'];
    } else {
      // console.log("No flip");
      return [reps, threshold_flag];
    }
  }

  // patient reaching out for button makes body NOT in plane
  function isBodyInPlane(init, curr) {
    if (init * 0.6 < curr && init * 1.2 > curr){
      return true;
    }
    return false;
  }

  //only start drawing with a body frame is detected
  //even though


  window.Bridge.aOnBodyFrame = (bodyFrame) =>
  {
    const parsedURL = parseURL(window.location.pathname);
    //clear out the canvas so that the previous frame will not overlap
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ref_ctx.clearRect(0, 0, ref_canvas.width, ref_canvas.height);
    exe_ctx.clearRect(0, 0, exe_canvas.width, exe_canvas.height);
    //tag the canvas
    ctx.font="20px Arial";
    (notAligned) ? ctx.fillStyle = "red" : ctx.fillStyle = "#23D160";
    ctx.textAlign = "center";
    ctx.fillText("Current Set", canvas.width/2, canvas.height/20);
    drawGrids(ctx);
    drawFloorPlane(ctx);

    ref_ctx.font="20px Arial";
    //ref_ctx.fillStyle = "red";
    ref_ctx.fillStyle = "#1E89FB";
    ref_ctx.textAlign = "center";
    ref_ctx.fillText("Reference", canvas.width/2, canvas.height/20);
    drawGrids(ref_ctx);
    drawFloorPlane(ref_ctx);

    exe_ctx.font="20px Arial";
    //exe_ctx.fillStyle = "red";
    exe_ctx.fillStyle = "#7BE39F";
    exe_ctx.textAlign = "center";
    exe_ctx.fillText("Exercise", canvas.width/2, canvas.height/20);
    drawGrids(exe_ctx);
    drawFloorPlane(exe_ctx);

    //draw each joint circles when a body is tracked
    bodyFrame.bodies.forEach(function (body)
    {
      if (body.tracked)
      {
        //location of the neck
        let neck_x = body.joints[2].depthX;
        let neck_y = body.joints[2].depthY;

        //draw the body skeleton in live canvas
        drawBody(body,ctx, liveBodyColor, commonBlue);

        document.addEventListener('timer-done', function(evt){
          //console.log("timer done", evt.detail);
          nx_1stFrame = neck_x;
          ny_1stFrame = neck_y;
          nz_1stFrame = body.joints[2].cameraZ;
          bodyWidth = body.joints[8].depthX - body.joints[4].depthX;
          bodyHeight = body.joints[0].depthY - body.joints[2].depthY;

          //console.log("neck position in the first frame recorded: " + nx_1stFrame + ny_1stFrame + nz_1stFrame);
          st = new Date().getTime();
          if ((parsedURL.type === 'reference') && (parsedURL.mode === 'play')) {
            localStorage.setItem("refStart", st);
          }
        });

        if(JSON.parse(localStorage.getItem('canStartRecording')) === true)
        {
          //filter joints, remove fingertips and spineShoulder for they are not used
          body.joints.splice(20,5);
          liveFrames.push(body);
          if ((parsedURL.type === 'practice') && (parsedURL.mode === 'play')) {
            // countReps and timing
            console.log("Here: " + dataForCntReps.diffLevel + "\t" + threshold_flag);
            let tempCnt = countReps(body, threshold_flag, dataForCntReps.diffLevel, 0.25);

            threshold_flag = tempCnt[1];
            document.getElementById("cntReps").innerHTML =
              parseInt(document.getElementById("cntReps").innerHTML) + parseInt(tempCnt[0]);

            if (tempCnt[0] === 1) {
              ed = new Date().getTime();
              console.log("end time: ", ed);
              let diff = Math.round((ed - st) / 1000);
              let speedEval = "It takes " + diff + " s";

              //Note: online speed is not very accurate
              let repItem = {"speed": diff};
              repEvals.push(repItem);
              localStorage.setItem("repEvals", JSON.stringify((repEvals)));

              //document.getElementById("speedEval").innerHTML = speedEval;
              st = ed;
              console.log("start time: ", st);
            }
          }
        }
      }
    });

    //if the patient is in position and doing a practice session
    if(JSON.parse(localStorage.getItem('canStartRecording')) === true && (parsedURL.type === 'practice') && (parsedURL.mode === 'play')) {

      //draw in the reference canvas
        drawBody(refFrames[ref_index], ref_ctx, commonBlue,refJointColor, false);
        //display one frame of reference every 2 frames of live frame captured
        //we can manipulate the number to control the display speed
        ref_index = (ref_index + 1) % refFrames.length;
    }

    //check if it is in the state of displaying reference, if reference exists
    //1. end of creating reference and end of updating
    //2. start of updating
    //3. start of practice
    //4. end of practice
    //in theses cases, the in-position will not be checked
    else if (((parsedURL.type === 'reference') && (parsedURL.mode === 'stop')) ||
      ((parsedURL.type === 'reference') && (parsedURL.mode === 'start') && (refFrames.length > 0)) ||
      ((parsedURL.type === 'practice') && (parsedURL.mode === 'start' || parsedURL.mode === 'end')) ||
      ((parsedURL.type === 'practice') && (parsedURL.mode === 'stop'))
    )
    {
      //draw in the reference canvas
      drawBody(refFrames[ref_index], ref_ctx,commonBlue, refJointColor, false);
      //if in the end of practice state, we will also display the latest exercise, with the same frequency as the reference
      if((parsedURL.type === 'practice') && (parsedURL.mode === 'stop'))
      {
        drawBody(recentFrames[exe_index], exe_ctx,liveBodyColor,commonBlue ,false);
      }
      ref_index = (ref_index + 1) % refFrames.length;
      if(recentFrames) {
        exe_index = (exe_index + 1) % recentFrames.length;
      }
    }
  };

  function isElectron() {
    return 'Bridge' in window;
  }
})();

},{"popups":1}]},{},[2]);

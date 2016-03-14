(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.d3bind = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var unbind_1 = require('./unbind');
var helpers_1 = require('../observable/helpers');
var logger_1 = require('../utils/logger');
function bind(selection, name, observable, converter, applyFunc) {
    var logger = logger_1.default.get('Selection', name);
    applyFunc(helpers_1.getSubscribedValue(observable, converter));
    var unsubscribeFunc = helpers_1.subscribe(observable, converter, function (newValue, oldValue, caller) {
        logger.log(newValue, '| oldValue:', oldValue, '| caller:', caller, '| node:', selection.node());
        applyFunc(newValue, caller);
    });
    unbind_1.setUnbindForSelectionField(selection, name, unsubscribeFunc);
}
exports.bind = bind;
var TRANSITION_PREFIX = 'd3bind_';
function getTransitionSelection(selection, transition, name) {
    var transitionName = TRANSITION_PREFIX + name;
    var _selection = null;
    if (transition && transition.transition) {
        var _transition = selection.transition(transitionName);
        if (typeof transition.transition === 'function') {
            var transitionConverter = transition.transition;
            _selection = transitionConverter(_transition);
        }
        else {
            _selection = _transition;
        }
    }
    else {
        _selection = selection;
    }
    return _selection;
}
exports.getTransitionSelection = getTransitionSelection;
function bindWithTransition(selection, name, observable, converter, transition, applyFunc) {
    var logger = logger_1.default.get('Selection', name);
    applyFunc(selection, helpers_1.getSubscribedValue(observable, converter));
    var unsubscribeFunc = helpers_1.subscribe(observable, converter, function (newValue, oldValue, caller) {
        var _selection = getTransitionSelection(selection, transition, name);
        logger.log(newValue, '| oldValue:', oldValue, '| caller:', caller, '| node:', selection.node());
        applyFunc(_selection, newValue, caller);
    });
    unbind_1.setUnbindForSelectionField(selection, name, unsubscribeFunc);
}
exports.bindWithTransition = bindWithTransition;

},{"../observable/helpers":22,"../utils/logger":46,"./unbind":3}],2:[function(require,module,exports){
var helpers_1 = require('../observable/helpers');
var proxy_1 = require('../observable/proxy');
var unbind_1 = require('./unbind');
function addObservableSetter(source, object, name) {
    var sourceFunc = source[name];
    var observable = new proxy_1.default(function () { return sourceFunc(); }, function (value) { return sourceFunc(value); }, name);
    var override = function (value) {
        if (value !== undefined) {
            observable.set(value);
            return object;
        }
        else {
            return sourceFunc();
        }
    };
    object[name] = override;
    object['$' + name] = observable;
    var bindName = name.charAt(0).toUpperCase() + name.substr(1);
    object['bind' + bindName] = function (observable, converter) {
        override(helpers_1.getSubscribedValue(observable, converter));
        var unsubscribeFunc = helpers_1.subscribe(observable, converter, function (value) {
            override(value);
        });
        unbind_1.setUnbindForObjectField(object, name, unsubscribeFunc);
        return object;
    };
    object['unbind' + bindName] = function () {
        unbind_1.unbindObjectField(object, name);
        return object;
    };
}
exports.addObservableSetter = addObservableSetter;

},{"../observable/helpers":22,"../observable/proxy":27,"./unbind":3}],3:[function(require,module,exports){
var UNSUBSCRIBE_PREFIX = '__d3bind_unsubscribe';
function setUnbindForSelectionField(selection, name, unsubscribeFunc) {
    unbindSelectionField(selection, name);
    selection.each(function () {
        bindObjectField(this, name, unsubscribeFunc);
    });
}
exports.setUnbindForSelectionField = setUnbindForSelectionField;
function unbindSelectionField(selection, name) {
    var unsubscribedCount = 0;
    selection.each(function () {
        unsubscribedCount += unbindObjectField(this, name);
    });
    return unsubscribedCount;
}
exports.unbindSelectionField = unbindSelectionField;
function setUnbindForObjectField(object, name, unsubscribeFunc) {
    unbindObjectField(object, name);
    bindObjectField(object, name, unsubscribeFunc);
}
exports.setUnbindForObjectField = setUnbindForObjectField;
function unbindObjectField(object, name) {
    var unsubscribedCount = 0;
    if (object[UNSUBSCRIBE_PREFIX] && object[UNSUBSCRIBE_PREFIX][name]) {
        unsubscribedCount = object[UNSUBSCRIBE_PREFIX][name]();
        delete object[UNSUBSCRIBE_PREFIX][name];
    }
    return unsubscribedCount;
}
exports.unbindObjectField = unbindObjectField;
function bindObjectField(object, name, unsubscribeFunc) {
    if (!object[UNSUBSCRIBE_PREFIX]) {
        object[UNSUBSCRIBE_PREFIX] = {};
    }
    object[UNSUBSCRIBE_PREFIX][name] = unsubscribeFunc;
}
function unbindSelection(selection, descendants) {
    if (descendants === void 0) { descendants = false; }
    var unsubscribedCount = 0;
    selection.each(function () {
        unsubscribedCount += descendants ? unbindElementTree(this) : unbindElement(this);
    });
    return unsubscribedCount;
}
exports.unbindSelection = unbindSelection;
function unbindElementTree(root) {
    var unsubscribedCount = 0;
    unsubscribedCount += unbindElement(root);
    for (var i = 0; i < root.childNodes.length; i++) {
        unsubscribedCount += unbindElementTree(root.childNodes.item(i));
    }
    return unsubscribedCount;
}
function unbindElement(element) {
    return unbindObject(element);
}
function unbindObject(object) {
    var unsubscribedCount = 0;
    var unsubscribeFunctions = object[UNSUBSCRIBE_PREFIX];
    if (unsubscribeFunctions) {
        for (var key in unsubscribeFunctions) {
            unsubscribedCount += unsubscribeFunctions[key]();
        }
        for (var key in unsubscribeFunctions) {
            delete unsubscribeFunctions[key];
        }
    }
    return unsubscribedCount;
}
exports.unbindObject = unbindObject;

},{}],4:[function(require,module,exports){
require('./core/selection-bindings');
require('./core/selection-bindcall');
require('./core/selection-override');
require('./core/selection-unbinds');
require('./core/selection-custombind');
require('./repeat/repeat');
require('./repeat/bind-repeat');
require('./input/bind-input');
require('./redraw/bind-redraw');
require('./core/root-override');
require('./root/observable');
require('./root/wrap');
require('./root/root');
require('./transition/transition');

},{"./core/root-override":6,"./core/selection-bindcall":7,"./core/selection-bindings":8,"./core/selection-custombind":9,"./core/selection-override":10,"./core/selection-unbinds":11,"./input/bind-input":13,"./redraw/bind-redraw":34,"./repeat/bind-repeat":37,"./repeat/repeat":38,"./root/observable":40,"./root/root":41,"./root/wrap":42,"./transition/transition":45}],5:[function(require,module,exports){
var selection_1 = require('../selection');
function addBindingFunctionsToSelection(d3selection) {
    var d3bindSelection = Object.create(d3selection);
    for (var key in selection_1.default) {
        d3bindSelection[key] = selection_1.default[key];
    }
    return d3bindSelection;
}
exports.addBindingFunctionsToSelection = addBindingFunctionsToSelection;
function override(selection, func) {
    var _super = Object.getPrototypeOf(selection);
    var newSelection = func(_super);
    return addBindingFunctionsToSelection(newSelection);
}
exports.override = override;

},{"../selection":44}],6:[function(require,module,exports){
var root_1 = require('../root');
var override_utils_1 = require("./override-utils");
function select(selectorInput) {
    var selection = d3.select(selectorInput);
    return override_utils_1.addBindingFunctionsToSelection(selection);
}
root_1.default.select = select;
function selectAll(selectorInput) {
    var selection = d3.selectAll(selectorInput);
    return override_utils_1.addBindingFunctionsToSelection(selection);
}
root_1.default.selectAll = selectAll;
function selection() {
    var selection = d3.selection();
    return override_utils_1.addBindingFunctionsToSelection(selection);
}
root_1.default.selection = selection;

},{"../root":39,"./override-utils":5}],7:[function(require,module,exports){
var helpers_1 = require('../observable/helpers');
var selection_1 = require("../selection");
var unbind_1 = require('../bindings/unbind');
var selection_2 = require('../bindings/selection');
var logger_1 = require('../utils/logger');
var BIND_CALL_ID = 'd3bind_bindCall_id';
var bindCallSequence = 0;
function getFuncId(func) {
    return func[BIND_CALL_ID];
}
function setFuncId(func) {
    if (func[BIND_CALL_ID] === undefined) {
        func[BIND_CALL_ID] = bindCallSequence++;
    }
}
function bindCall(observable, func, transition) {
    var _this = this;
    var logger = logger_1.default.get('Selection', 'call' + (func.name ? (':' + func.name) : ''));
    setFuncId(func);
    this.call(func);
    var unsubscribeFunc = helpers_1.subscribe(observable, function () { return null; }, function (newValue, oldValue, caller) {
        var _selection = selection_2.getTransitionSelection(_this, transition, 'call:' + getFuncId(func));
        logger.log('caller:', caller, '| node:', _this.node());
        _selection.call(func);
    });
    unbind_1.setUnbindForSelectionField(this, 'call:' + getFuncId(func), unsubscribeFunc);
    return this;
}
selection_1.default.bindCall = bindCall;
function unbindCall(func) {
    unbind_1.unbindSelectionField(this, 'call:' + getFuncId(func));
    return this;
}
selection_1.default.unbindCall = unbindCall;

},{"../bindings/selection":1,"../bindings/unbind":3,"../observable/helpers":22,"../selection":44,"../utils/logger":46}],8:[function(require,module,exports){
var selection_1 = require('../bindings/selection');
var selection_2 = require("../selection");
function bindText(observable, converterOrTransition, transition) {
    var converter = typeof converterOrTransition === 'function' ? converterOrTransition : null;
    var transition = typeof converterOrTransition === 'function' ? transition : converterOrTransition;
    selection_1.bindWithTransition(this, 'text', observable, converter, transition, function (selection, value) {
        selection.text(value);
    });
    return this;
}
selection_2.default.bindText = bindText;
function bindHtml(observable, converter) {
    var _this = this;
    selection_1.bind(this, 'html', observable, converter, function (value) {
        _this.html(value);
    });
    return this;
}
selection_2.default.bindHtml = bindHtml;
function bindClassed(className, observable, converter) {
    var _this = this;
    selection_1.bind(this, 'classed:' + className, observable, converter, function (value) {
        _this.classed(className, value);
    });
    return this;
}
selection_2.default.bindClassed = bindClassed;
function bindStyle(styleName, observable, converterOrTransition, transition) {
    var converter = typeof converterOrTransition === 'function' ? converterOrTransition : null;
    var transition = typeof converterOrTransition === 'function' ? transition : converterOrTransition;
    selection_1.bindWithTransition(this, 'style:' + styleName, observable, converter, transition, function (selection, value) {
        selection.style(styleName, value);
    });
    return this;
}
selection_2.default.bindStyle = bindStyle;
function bindAttr(attr, observable, converterOrTransition, transition) {
    var converter = typeof converterOrTransition === 'function' ? converterOrTransition : null;
    var transition = typeof converterOrTransition === 'function' ? transition : converterOrTransition;
    selection_1.bindWithTransition(this, 'attr:' + attr, observable, converter, transition, function (selection, value) {
        selection.attr(attr, value);
    });
    return this;
}
selection_2.default.bindAttr = bindAttr;
function bindProperty(property, observable, converter) {
    var _this = this;
    selection_1.bind(this, 'property:' + property, observable, converter, function (value) {
        _this.property(property, value);
    });
    return this;
}
selection_2.default.bindProperty = bindProperty;

},{"../bindings/selection":1,"../selection":44}],9:[function(require,module,exports){
var helpers_1 = require('../observable/helpers');
var selection_1 = require("../selection");
var unbind_1 = require('../bindings/unbind');
var logger_1 = require('../utils/logger');
var CUSTOM_BIND_ID = 'd3bind_custom_bind_id';
var customBindSequence = 0;
function getFuncId(func) {
    return func[CUSTOM_BIND_ID];
}
function setFuncId(func) {
    if (func[CUSTOM_BIND_ID] === undefined) {
        func[CUSTOM_BIND_ID] = customBindSequence++;
    }
}
function applyFunc(selection, observable, func) {
    if (observable instanceof Array) {
        func.apply(selection, observable.map(function (item) { return item.get(); }).concat(selection));
    }
    else {
        func.call(selection, observable.get(), selection);
    }
}
function bind(observable, func) {
    var _this = this;
    var logger = logger_1.default.get('Selection', 'custom' + (func.name ? (':' + func.name) : ''));
    setFuncId(func);
    applyFunc(this, observable, func);
    var unsubscribeFunc = helpers_1.subscribe(observable, function () { return null; }, function (newValue, oldValue, caller) {
        logger.log('caller:', caller, '| node:', _this.node());
        applyFunc(_this, observable, func);
    });
    unbind_1.setUnbindForSelectionField(this, 'custom:' + getFuncId(func), unsubscribeFunc);
    return this;
}
selection_1.default.bind = bind;
function unbind(func) {
    unbind_1.unbindSelectionField(this, 'custom:' + getFuncId(func));
    return this;
}
selection_1.default.unbind = unbind;

},{"../bindings/unbind":3,"../observable/helpers":22,"../selection":44,"../utils/logger":46}],10:[function(require,module,exports){
var override_utils_1 = require('./override-utils');
var selection_1 = require("../selection");
var unbind_1 = require('../bindings/unbind');
var transition_override_1 = require('./transition-override');
function append(param) {
    return override_utils_1.override(this, function (_super) { return _super.append(param); });
}
selection_1.default.append = append;
function insert(param, before) {
    return override_utils_1.override(this, function (_super) { return _super.insert(param, before); });
}
selection_1.default.insert = insert;
function select(param) {
    return override_utils_1.override(this, function (_super) { return _super.select(param); });
}
selection_1.default.select = select;
function selectAll(param) {
    return override_utils_1.override(this, function (_super) { return _super.selectAll(param); });
}
selection_1.default.selectAll = selectAll;
selection_1.default.remove = function (keepBindings) {
    var _super = Object.getPrototypeOf(this);
    _super.remove();
    if (!keepBindings) {
        unbind_1.unbindSelection(this, true);
    }
    return this;
};
selection_1.default.transition = function (name) {
    var superSelection = Object.getPrototypeOf(this);
    var superTransition = superSelection.transition(name);
    return transition_override_1.default(this, superTransition);
};

},{"../bindings/unbind":3,"../selection":44,"./override-utils":5,"./transition-override":12}],11:[function(require,module,exports){
var selection_1 = require("../selection");
var unbind_1 = require('../bindings/unbind');
selection_1.default.unbindText = function () {
    unbind_1.unbindSelectionField(this, 'text');
    return this;
};
selection_1.default.unbindHtml = function () {
    unbind_1.unbindSelectionField(this, 'html');
    return this;
};
selection_1.default.unbindClassed = function (className) {
    unbind_1.unbindSelectionField(this, 'classed:' + className);
    return this;
};
selection_1.default.unbindStyle = function (styleName) {
    unbind_1.unbindSelectionField(this, 'style:' + styleName);
    return this;
};
selection_1.default.unbindAttr = function (attr) {
    unbind_1.unbindSelectionField(this, 'attr:' + attr);
    return this;
};
selection_1.default.unbindProperty = function (property) {
    unbind_1.unbindSelectionField(this, 'property:' + property);
    return this;
};
selection_1.default.unbindAll = function (descendants) {
    if (descendants === void 0) { descendants = false; }
    unbind_1.unbindSelection(this, descendants);
    return this;
};

},{"../bindings/unbind":3,"../selection":44}],12:[function(require,module,exports){
var unbind_1 = require('../bindings/unbind');
function overrideTransition(selection, superTransition) {
    var transition = Object.create(superTransition);
    transition.remove = function (keepBindings) {
        superTransition.remove();
        if (!keepBindings) {
            unbind_1.unbindSelection(selection, true);
        }
        return this;
    };
    transition.transition = function () {
        var superSubTransition = superTransition.transition();
        return overrideTransition(selection, superSubTransition);
    };
    transition.select = function (selector) {
        var superSubTransition = superTransition.select(selector);
        var subSelection = selection.select(selector);
        return overrideTransition(subSelection, superSubTransition);
    };
    transition.selectAll = function (selector) {
        var superSubTransition = superTransition.selectAll(selector);
        var subSelection = selection.selectAll(selector);
        return overrideTransition(subSelection, superSubTransition);
    };
    transition.filter = function (selector) {
        var superSubTransition = superTransition.filter(selector);
        var subSelection = selection.filter(selector);
        return overrideTransition(subSelection, superSubTransition);
    };
    return transition;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = overrideTransition;

},{"../bindings/unbind":3}],13:[function(require,module,exports){
var selection_1 = require('../bindings/selection');
var selection_2 = require("../selection");
var unbind_1 = require('../bindings/unbind');
var EVENT_NAMESPACE = '.d3bind_input';
function bindInput(observable) {
    var _this = this;
    var self = this;
    var propertyName = this.property('type') === 'checkbox' ? 'checked' : 'value';
    var eventName = this.property('type') === 'checkbox' ? 'change' : 'input';
    selection_1.bind(this, 'input', observable, null, function (value, caller) {
        if (caller !== _this) {
            _this.property(propertyName, value);
        }
    });
    this.on(eventName + EVENT_NAMESPACE, function () {
        observable.set(this[propertyName], false, self);
    });
    return this;
}
selection_2.default.bindInput = bindInput;
selection_2.default.unbindInput = function () {
    unbind_1.unbindSelectionField(this, 'input');
    var eventName = this.property('type') === 'checkbox' ? 'change' : 'input';
    this.on(eventName + EVENT_NAMESPACE, null);
    return this;
};

},{"../bindings/selection":1,"../bindings/unbind":3,"../selection":44}],14:[function(require,module,exports){
require('./build');
var root_1 = require('./root');
module.exports = root_1.default;

},{"./build":4,"./root":39}],15:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var logger_1 = require('../utils/logger');
var subscribable_1 = require("./subscribable");
var AbstractObservable = (function (_super) {
    __extends(AbstractObservable, _super);
    function AbstractObservable(_name) {
        _super.call(this);
        this._name = _name;
        this._logger = logger_1.default.get(this.constructor.name, _name);
    }
    AbstractObservable.prototype._trigger = function (newValue, oldValue, caller) {
        this._logger.logIndent(newValue, '| oldValue:', oldValue, '| caller:', caller);
        this._subscribers.forEach(function (subscriber) {
            subscriber.call(null, newValue, oldValue, caller);
        });
        this._logger.logUnindent();
    };
    AbstractObservable.prototype.trigger = function (caller) {
        var value = this.get();
        this._trigger(value, value, caller);
    };
    return AbstractObservable;
})(subscribable_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AbstractObservable;

},{"../utils/logger":46,"./subscribable":31}],16:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require('./abstract');
var ObservableArrayAllAccessor = (function (_super) {
    __extends(ObservableArrayAllAccessor, _super);
    function ObservableArrayAllAccessor(array, accessor) {
        var _this = this;
        _super.call(this);
        this.array = array;
        this.accessor = accessor;
        this._unbinds = [];
        array.forEach(function (item, i) {
            _this._subscribeItem(item, i);
        });
        array.subscribe({
            insert: function (item, i) {
                _this._subscribeItem(item, i);
                var value = _this.accessor(item).get();
                _this._trigger(value, null);
            },
            remove: function (item, i) {
                _this._unsubscribeItem(item, i);
                var value = _this.accessor(item).get();
                _this._trigger(null, value);
            },
            replace: function (item, i, oldItem, caller) {
                _this._unsubscribeItem(oldItem, i);
                _this._subscribeItem(item, i);
                var value = _this.accessor(item).get();
                var oldValue = _this.accessor(oldItem).get();
                _this._trigger(value, oldValue, caller);
            }
        });
    }
    ObservableArrayAllAccessor.prototype._subscribeItem = function (item, index) {
        var _this = this;
        var observable = this.accessor(item);
        var unbind = observable.subscribe(function (value, oldValue, caller) {
            _this._trigger(value, oldValue, caller);
        });
        this._unbinds.splice(index, 0, unbind);
    };
    ObservableArrayAllAccessor.prototype._unsubscribeItem = function (item, index) {
        this._unbinds[index]();
        this._unbinds.splice(index, 1);
    };
    ObservableArrayAllAccessor.prototype.get = function () {
        return null;
    };
    return ObservableArrayAllAccessor;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableArrayAllAccessor;

},{"./abstract":15}],17:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require('./abstract');
var ObservableArrayAll = (function (_super) {
    __extends(ObservableArrayAll, _super);
    function ObservableArrayAll(array) {
        var _this = this;
        _super.call(this);
        this.array = array;
        array.subscribe({
            insert: function (item, i) {
                _this._trigger(item, null);
            },
            remove: function (item, i) {
                _this._trigger(null, item);
            },
            replace: function (item, i, oldItem, caller) {
                _this._trigger(item, oldItem, caller);
            }
        });
    }
    ObservableArrayAll.prototype.get = function () {
        return null;
    };
    return ObservableArrayAll;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableArrayAll;

},{"./abstract":15}],18:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require('./abstract');
var ObservableArrayIndex = (function (_super) {
    __extends(ObservableArrayIndex, _super);
    function ObservableArrayIndex(_list, _index) {
        var _this = this;
        _super.call(this, _index.toString());
        this._list = _list;
        this._index = _index;
        _list.subscribe({
            insert: function (value, index) {
                if (index <= _this._index && _this._list.length > _this._index) {
                    var oldValue = _this._index + 1 < _this._list.length ? _this._list.get(_this._index + 1) : undefined;
                    var newValue = _this._list.length > _this._index ? _this.get() : undefined;
                    _this._trigger(newValue, oldValue);
                }
            },
            remove: function (value, index) {
                if (index <= _this._index && _this._list.length >= _this._index) {
                    var oldValue = _this._index - 1 >= 0 ? _this._list.get(_this._index - 1) : undefined;
                    var newValue = _this._list.length > _this._index ? _this.get() : undefined;
                    _this._trigger(newValue, oldValue);
                }
            },
            replace: function (value, index, oldValue, caller) {
                if (index === _this._index) {
                    _this._trigger(value, oldValue, caller);
                }
            }
        });
    }
    ObservableArrayIndex.prototype.get = function () {
        return this._list.get(this._index);
    };
    ObservableArrayIndex.prototype.set = function (value, noTrigger, caller) {
        this._list.set(this._index, value, noTrigger, caller);
    };
    return ObservableArrayIndex;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableArrayIndex;

},{"./abstract":15}],19:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require('./abstract');
var ObservableArrayLength = (function (_super) {
    __extends(ObservableArrayLength, _super);
    function ObservableArrayLength(_list) {
        var _this = this;
        _super.call(this);
        this._list = _list;
        _list.subscribe({
            insert: function () {
                _this._trigger(_list.length, _list.length - 1);
            },
            remove: function () {
                _this._trigger(_list.length, _list.length + 1);
            },
            replace: function () { }
        });
    }
    ObservableArrayLength.prototype.get = function () {
        return this._list.length;
    };
    return ObservableArrayLength;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableArrayLength;

},{"./abstract":15}],20:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var array_length_1 = require('./array-length');
var array_index_1 = require("./array-index");
var logger_1 = require('../utils/logger');
var subscribable_1 = require("./subscribable");
var array_all_1 = require("./array-all");
var array_all_accessor_1 = require("./array-all-accessor");
var ObservableArray = (function (_super) {
    __extends(ObservableArray, _super);
    function ObservableArray(array) {
        _super.call(this);
        this._array = [];
        this._logger = logger_1.default.get(this.constructor.name);
        this._array = array || [];
        this._observableLength = new array_length_1.default(this);
    }
    Object.defineProperty(ObservableArray.prototype, "array", {
        get: function () {
            return this._array;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ObservableArray.prototype, "length", {
        get: function () {
            return this._array.length;
        },
        enumerable: true,
        configurable: true
    });
    ObservableArray.prototype._triggerInsert = function (item, index) {
        this._logger.logIndent('insert:', item, '| index:', index);
        this._subscribers.forEach(function (subscriber) {
            subscriber.insert.call(null, item, index);
        });
        this._logger.logUnindent();
    };
    ObservableArray.prototype._triggerRemove = function (item, index) {
        this._logger.logIndent('remove:', item, '| index:', index);
        this._subscribers.forEach(function (subscriber) {
            subscriber.remove.call(null, item, index);
        });
        this._logger.logUnindent();
    };
    ObservableArray.prototype._triggerReplace = function (item, index, oldValue, caller) {
        this._logger.logIndent('replace:', item, '| index:', index, '| oldValue:', oldValue, '| caller:', caller);
        this._subscribers.forEach(function (subscriber) {
            if (subscriber.replace != null) {
                subscriber.replace.call(null, item, index, oldValue, caller);
            }
            else {
                subscriber.remove.call(null, oldValue, index);
                subscriber.insert.call(null, item, index);
            }
        });
        this._logger.logUnindent();
    };
    Object.defineProperty(ObservableArray.prototype, "$length", {
        get: function () {
            return this._observableLength;
        },
        enumerable: true,
        configurable: true
    });
    ObservableArray.prototype.$index = function (index) {
        return new array_index_1.default(this, index);
    };
    ObservableArray.prototype.$all = function (accessor) {
        if (accessor) {
            return new array_all_accessor_1.default(this, accessor);
        }
        else {
            return new array_all_1.default(this);
        }
    };
    ObservableArray.prototype.get = function (index) {
        return this._array[index];
    };
    ObservableArray.prototype.set = function (index, value, noTrigger, caller) {
        if (noTrigger === void 0) { noTrigger = false; }
        var oldValue = this._array[index];
        this._array[index] = value;
        if (!noTrigger) {
            this._triggerReplace(value, index, oldValue, caller);
        }
    };
    ObservableArray.prototype.insert = function (index, item) {
        this._array.splice(index, 0, item);
        this._triggerInsert(item, index);
    };
    ObservableArray.prototype.remove = function (item) {
        var index = this._array.indexOf(item);
        if (index >= 0) {
            this._array.splice(index, 1);
            this._triggerRemove(item, index);
            return true;
        }
        return false;
    };
    ObservableArray.prototype.forEach = function (callback) {
        var _this = this;
        this._array.forEach(function (value, index) {
            callback.call(null, value, index, _this);
        });
    };
    ObservableArray.prototype.map = function (callback) {
        var _this = this;
        return new ObservableArray(this._array.map(function (item, index) { return callback(item, index, _this); }));
    };
    ObservableArray.prototype.filter = function (callback) {
        var _this = this;
        return new ObservableArray(this._array.filter(function (item, index) { return callback(item, index, _this); }));
    };
    ObservableArray.prototype.reduce = function (callback, initialValue) {
        var _this = this;
        return this._array.reduce(function (previousValue, currentValue, currentIndex) { return callback(previousValue, currentValue, currentIndex, _this); }, initialValue);
    };
    ObservableArray.prototype.reduceRight = function (callback, initialValue) {
        var _this = this;
        return this._array.reduceRight(function (previousValue, currentValue, currentIndex) { return callback(previousValue, currentValue, currentIndex, _this); }, initialValue);
    };
    ObservableArray.prototype.concat = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        return new ObservableArray(this._array.concat(items));
    };
    ObservableArray.prototype.slice = function (start, end) {
        return new ObservableArray(this._array.slice(start, end));
    };
    ObservableArray.prototype.join = function (separator) {
        return this._array.join(separator);
    };
    ObservableArray.prototype.every = function (callback) {
        return this._array.every(callback);
    };
    ObservableArray.prototype.some = function (callback) {
        return this._array.some(callback);
    };
    ObservableArray.prototype.indexOf = function (searchElement, fromIndex) {
        return this._array.indexOf(searchElement, fromIndex);
    };
    ObservableArray.prototype.lastIndexOf = function (searchElement, fromIndex) {
        return this._array.lastIndexOf(searchElement, fromIndex);
    };
    ObservableArray.prototype.toString = function () {
        return this._array.toString();
    };
    ObservableArray.prototype.toLocaleString = function () {
        return this._array.toLocaleString();
    };
    ObservableArray.prototype.push = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        for (var i = 0; i < items.length; i++) {
            this._array.push(items[i]);
            this._triggerInsert(items[i], this.length - 1);
        }
        return this.length;
    };
    ObservableArray.prototype.pop = function () {
        if (this.length === 0)
            return;
        var removedItem = this._array.pop();
        this._triggerRemove(removedItem, this.length);
        return removedItem;
    };
    ObservableArray.prototype.shift = function () {
        if (this.length === 0)
            return;
        var removedItem = this._array.shift();
        this._triggerRemove(removedItem, 0);
        return removedItem;
    };
    ObservableArray.prototype.unshift = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        for (var i = items.length - 1; i >= 0; i--) {
            this._array.splice(0, 0, items[i]);
            this._triggerInsert(items[i], 0);
        }
        return this.length;
    };
    ObservableArray.prototype.splice = function (start, removeCount) {
        var newItems = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            newItems[_i - 2] = arguments[_i];
        }
        if (start > this.length) {
            start = this.length;
        }
        else if (start < 0) {
            if (-start > this.length) {
                start = 0;
            }
            else {
                start = this.length + start;
            }
        }
        removeCount = removeCount !== undefined ? Math.min(removeCount, this.length - start) : this.length - start;
        var removedItems = [];
        for (var i = 0; i < removeCount; i++) {
            var removedItem = this._array.splice(start, 1)[0];
            removedItems.push(removedItem);
            this._triggerRemove(removedItem, start);
        }
        for (var i = 0; i < newItems.length; i++) {
            this._array.splice(start + i, 0, newItems[i]);
            this._triggerInsert(newItems[i], start + i);
        }
        return removedItems;
    };
    ObservableArray.bindTo = function (source, mapper) {
        var map = function (item, i) { return mapper ? mapper.call(source, item, i) : item; };
        var result = new ObservableArray();
        source.forEach(function (item, i) {
            result.push(map(item, i));
        });
        source.subscribe({
            insert: function (item, index) { result.insert(index, map(item, index)); },
            remove: function (item, index) { result.splice(index, 1); },
            replace: function (item, index, oldValue, caller) { result.set(index, map(item, index), false, caller); }
        });
        return result;
    };
    return ObservableArray;
})(subscribable_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableArray;

},{"../utils/logger":46,"./array-all":17,"./array-all-accessor":16,"./array-index":18,"./array-length":19,"./subscribable":31}],21:[function(require,module,exports){
var property_1 = require("./property");
var array_1 = require('./array');
var value_1 = require('./value');
function isSingleValue(value) {
    if (value === undefined || value === null
        || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        || value.constructor === Number || value.constructor === String || value.constructor === Boolean
        || value instanceof RegExp) {
        return true;
    }
    return false;
}
function toObservable(object) {
    if (Array.isArray(object)) {
        return new array_1.default(object);
    }
    else if (isSingleValue(object)) {
        return new value_1.default(object);
    }
    else {
        for (var key in object) {
            property_1.default.on(object, key);
        }
        return object;
    }
}
exports.toObservable = toObservable;
function toDeepObservable(object) {
    if (Array.isArray(object)) {
        var obsItems = object.map(function (item) { return toDeepObservable(item); });
        return new array_1.default(obsItems);
    }
    else if (isSingleValue(object)) {
        return object;
    }
    else {
        for (var key in object) {
            object[key] = toDeepObservable(object[key]);
            property_1.default.on(object, key);
        }
        return object;
    }
}
exports.toDeepObservable = toDeepObservable;

},{"./array":20,"./property":26,"./value":32}],22:[function(require,module,exports){
function getSubscribedValue(observable, converter) {
    if (converter != null && observable instanceof Array) {
        var inputs = observable.map(function (property) { return property.get(); });
        return converter.apply(null, inputs);
    }
    else if (converter != null) {
        return converter.call(null, observable.get());
    }
    else {
        return observable.get();
    }
}
exports.getSubscribedValue = getSubscribedValue;
function unsubscribeEvery(func) {
    if (func instanceof Array) {
        return func.map(function (funcItem) { return funcItem(); }).filter(function (unsubscribed) { return unsubscribed; }).length;
    }
    else if (func instanceof Function) {
        return func() ? 1 : 0;
    }
}
function subscribeEvery(observable, handler) {
    var unbind = null;
    if (observable instanceof Array) {
        unbind = observable.map(function (obsItem) { return obsItem.subscribe(handler); });
    }
    else {
        unbind = observable.subscribe(handler);
    }
    return function () { return unsubscribeEvery(unbind); };
}
exports.subscribeEvery = subscribeEvery;
function subscribe(observable, converter, handler) {
    var previousValue = getSubscribedValue(observable, converter);
    return subscribeEvery(observable, function (newValue, oldValue, caller) {
        var newConvertedValue = getSubscribedValue(observable, converter);
        handler.call(null, newConvertedValue, previousValue, caller);
        previousValue = newConvertedValue;
    });
}
exports.subscribe = subscribe;

},{}],23:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require('./abstract');
var ObservableMapKey = (function (_super) {
    __extends(ObservableMapKey, _super);
    function ObservableMapKey(_map, _key) {
        var _this = this;
        _super.call(this, _key.toString());
        this._map = _map;
        this._key = _key;
        _map.subscribe({
            insert: function (value, key) {
                if (key == _this._key) {
                    _this._trigger(value, undefined);
                }
            },
            remove: function (value, key) {
                if (key == _this._key) {
                    _this._trigger(undefined, value);
                }
            },
            replace: function (value, key, oldValue, caller) {
                if (key == _this._key) {
                    _this._trigger(value, oldValue, caller);
                }
            }
        });
    }
    ObservableMapKey.prototype.get = function () {
        return this._map.get(this._key);
    };
    ObservableMapKey.prototype.set = function (value, noTrigger, caller) {
        this._map.set(this._key, value, noTrigger, caller);
    };
    return ObservableMapKey;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableMapKey;

},{"./abstract":15}],24:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require('./abstract');
var ObservableMapSize = (function (_super) {
    __extends(ObservableMapSize, _super);
    function ObservableMapSize(_map) {
        var _this = this;
        _super.call(this);
        this._map = _map;
        _map.subscribe({
            insert: function () {
                _this._trigger(_map.size, _map.size - 1);
            },
            remove: function () {
                _this._trigger(_map.size, _map.size + 1);
            },
            replace: function () { }
        });
    }
    ObservableMapSize.prototype.get = function () {
        return this._map.size;
    };
    return ObservableMapSize;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableMapSize;

},{"./abstract":15}],25:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var map_size_1 = require('./map-size');
var map_key_1 = require('./map-key');
var logger_1 = require('../utils/logger');
var subscribable_1 = require("./subscribable");
var ObservableMap = (function (_super) {
    __extends(ObservableMap, _super);
    function ObservableMap() {
        _super.call(this);
        this._map = Object.create(null);
        this._size = 0;
        this._logger = logger_1.default.get(this.constructor.name);
        this._observableSize = new map_size_1.default(this);
    }
    Object.defineProperty(ObservableMap.prototype, "map", {
        get: function () {
            return this._map;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ObservableMap.prototype, "size", {
        get: function () {
            return this._size;
        },
        enumerable: true,
        configurable: true
    });
    ObservableMap.prototype._triggerInsert = function (item, key) {
        this._size++;
        this._logger.logIndent('insert:', item, '| key:', key);
        this._subscribers.forEach(function (subscriber) {
            subscriber.insert.call(null, item, key);
        });
        this._logger.logUnindent();
    };
    ObservableMap.prototype._triggerRemove = function (item, key) {
        this._size--;
        this._logger.logIndent('remove:', item, '| key:', key);
        this._subscribers.forEach(function (subscriber) {
            subscriber.remove.call(null, item, key);
        });
        this._logger.logUnindent();
    };
    ObservableMap.prototype._triggerReplace = function (item, key, oldValue, caller) {
        this._logger.logIndent('replace:', item, '| key:', key, '| oldValue:', oldValue, '| caller:', caller);
        this._subscribers.forEach(function (subscriber) {
            if (subscriber.replace != null) {
                subscriber.replace.call(null, item, key, oldValue, caller);
            }
            else {
                subscriber.remove.call(null, oldValue, key);
                subscriber.insert.call(null, item, key);
            }
        });
        this._logger.logUnindent();
    };
    Object.defineProperty(ObservableMap.prototype, "$size", {
        get: function () {
            return this._observableSize;
        },
        enumerable: true,
        configurable: true
    });
    ObservableMap.prototype.$key = function (key) {
        return new map_key_1.default(this, key);
    };
    ObservableMap.prototype.get = function (key) {
        return this._map[key];
    };
    ObservableMap.prototype.has = function (key) {
        return this._map[key] !== undefined;
    };
    ObservableMap.prototype.set = function (key, value, noTrigger, caller) {
        if (noTrigger === void 0) { noTrigger = false; }
        var oldValue = this._map[key];
        this._map[key] = value;
        if (!noTrigger) {
            if (oldValue !== undefined) {
                this._triggerReplace(value, key, oldValue, caller);
            }
            else {
                this._triggerInsert(value, key);
            }
        }
        return this;
    };
    ObservableMap.prototype.delete = function (key) {
        var value = this._map[key];
        if (value !== undefined) {
            delete this._map[key];
            this._triggerRemove(value, key);
            return true;
        }
        return false;
    };
    ObservableMap.prototype.clear = function () {
        for (var key in this._map) {
            var value = this._map[key];
            delete this._map[key];
            this._triggerRemove(value, key);
        }
    };
    ObservableMap.prototype.forEach = function (callback) {
        for (var key in this._map) {
            callback.call(null, this._map[key], key, this);
        }
    };
    ObservableMap.bindTo = function (source, keyMapper, valueMapper) {
        var result = new ObservableMap();
        source.forEach(function (item) {
            var key = keyMapper(item);
            var value = valueMapper !== undefined ? valueMapper(item) : item;
            result.set(key, value);
        });
        source.subscribe({
            insert: function (item) {
                var key = keyMapper(item);
                var value = valueMapper !== undefined ? valueMapper(item) : item;
                result.set(key, value);
            },
            remove: function (item) {
                result.delete(keyMapper(item));
            }
        });
        return result;
    };
    return ObservableMap;
})(subscribable_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableMap;

},{"../utils/logger":46,"./map-key":23,"./map-size":24,"./subscribable":31}],26:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require("./abstract");
var ObservableProperty = (function (_super) {
    __extends(ObservableProperty, _super);
    function ObservableProperty(parent, name) {
        var _this = this;
        _super.call(this, name);
        this._parent = parent;
        this._value = parent[name];
        Object.defineProperty(parent, name, {
            enumerable: true,
            get: function () { return _this._value; },
            set: function (value) { _this.set(value); }
        });
        parent['$' + name] = this;
    }
    Object.defineProperty(ObservableProperty.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ObservableProperty.prototype, "parent", {
        get: function () {
            return this._parent;
        },
        enumerable: true,
        configurable: true
    });
    ObservableProperty.prototype.get = function () {
        return this._value;
    };
    ObservableProperty.prototype.set = function (value, noTrigger, caller) {
        if (noTrigger === void 0) { noTrigger = false; }
        var oldValue = this._value;
        this._value = value;
        if (!noTrigger) {
            this._trigger(value, oldValue, caller);
        }
    };
    ObservableProperty.on = function (parent, name) {
        return new ObservableProperty(parent, name);
    };
    return ObservableProperty;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableProperty;

},{"./abstract":15}],27:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require("./abstract");
var ObservableProxy = (function (_super) {
    __extends(ObservableProxy, _super);
    function ObservableProxy(_getter, _setter, name) {
        _super.call(this, name);
        this._getter = _getter;
        this._setter = _setter;
    }
    ObservableProxy.prototype.get = function () {
        return this._getter();
    };
    ObservableProxy.prototype.set = function (value, noTrigger, caller) {
        if (noTrigger === void 0) { noTrigger = false; }
        var oldValue = this._getter();
        this._setter(value);
        if (!noTrigger) {
            this._trigger(value, oldValue, caller);
        }
    };
    return ObservableProxy;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableProxy;

},{"./abstract":15}],28:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require('./abstract');
var ObservableSetSize = (function (_super) {
    __extends(ObservableSetSize, _super);
    function ObservableSetSize(_set) {
        var _this = this;
        _super.call(this);
        this._set = _set;
        _set.subscribe({
            insert: function () {
                _this._trigger(_set.size, _set.size - 1);
            },
            remove: function () {
                _this._trigger(_set.size, _set.size + 1);
            }
        });
    }
    ObservableSetSize.prototype.get = function () {
        return this._set.size;
    };
    return ObservableSetSize;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableSetSize;

},{"./abstract":15}],29:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require('./abstract');
var ObservableSetValue = (function (_super) {
    __extends(ObservableSetValue, _super);
    function ObservableSetValue(_set, _value) {
        var _this = this;
        _super.call(this, _value.toString());
        this._set = _set;
        this._value = _value;
        _set.subscribe({
            insert: function (value) {
                if (value == _this._value) {
                    _this._trigger(true, false);
                }
            },
            remove: function (value) {
                if (value == _this._value) {
                    _this._trigger(false, true);
                }
            }
        });
    }
    ObservableSetValue.prototype.get = function () {
        return this._set.has(this._value);
    };
    return ObservableSetValue;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableSetValue;

},{"./abstract":15}],30:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var set_size_1 = require('./set-size');
var set_value_1 = require('./set-value');
var logger_1 = require('../utils/logger');
var subscribable_1 = require("./subscribable");
var ObservableSet = (function (_super) {
    __extends(ObservableSet, _super);
    function ObservableSet() {
        _super.call(this);
        this._map = Object.create(null);
        this._size = 0;
        this._logger = logger_1.default.get(this.constructor.name);
        this._observableSize = new set_size_1.default(this);
    }
    Object.defineProperty(ObservableSet.prototype, "size", {
        get: function () {
            return this._size;
        },
        enumerable: true,
        configurable: true
    });
    ObservableSet.prototype._triggerInsert = function (item) {
        this._size++;
        this._logger.logIndent('insert:', item);
        this._subscribers.forEach(function (subscriber) {
            subscriber.insert.call(null, item);
        });
        this._logger.logUnindent();
    };
    ObservableSet.prototype._triggerRemove = function (item) {
        this._size--;
        this._logger.logIndent('remove:', item);
        this._subscribers.forEach(function (subscriber) {
            subscriber.remove.call(null, item);
        });
        this._logger.logUnindent();
    };
    Object.defineProperty(ObservableSet.prototype, "$size", {
        get: function () {
            return this._observableSize;
        },
        enumerable: true,
        configurable: true
    });
    ObservableSet.prototype.$has = function (value) {
        return new set_value_1.default(this, value);
    };
    ObservableSet.prototype.has = function (value) {
        return this._map[value] !== undefined;
    };
    ObservableSet.prototype.add = function (value) {
        var exists = this._map[value];
        this._map[value] = true;
        if (exists === undefined) {
            this._triggerInsert(value);
        }
        return this;
    };
    ObservableSet.prototype.delete = function (value) {
        var exists = this._map[value];
        if (exists !== undefined) {
            delete this._map[value];
            this._triggerRemove(value);
            return true;
        }
        return false;
    };
    ObservableSet.prototype.clear = function () {
        for (var key in this._map) {
            delete this._map[key];
            this._triggerRemove(key);
        }
    };
    ObservableSet.prototype.forEach = function (callback) {
        for (var key in this._map) {
            callback.call(null, key, key, this);
        }
    };
    ObservableSet.bindTo = function (source, mapper) {
        var result = new ObservableSet();
        var counts = Object.create(null);
        source.forEach(function (item) {
            var value = mapper !== undefined ? mapper(item) : item;
            counts[value] = counts[value] ? ++counts[value] : 1;
            result.add(value);
        });
        source.subscribe({
            insert: function (item) {
                var value = mapper !== undefined ? mapper(item) : item;
                counts[value] = counts[value] ? ++counts[value] : 1;
                if (counts[value] === 1) {
                    result.add(value);
                }
            },
            remove: function (item) {
                var value = mapper !== undefined ? mapper(item) : item;
                counts[value] = counts[value] ? --counts[value] : 0;
                if (counts[value] === 0) {
                    result.delete(value);
                }
            }
        });
        return result;
    };
    return ObservableSet;
})(subscribable_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableSet;

},{"../utils/logger":46,"./set-size":28,"./set-value":29,"./subscribable":31}],31:[function(require,module,exports){
var Subscribable = (function () {
    function Subscribable() {
        this._subscribers = [];
    }
    Subscribable.prototype.subscribe = function (handler) {
        var _this = this;
        this._subscribers.push(handler);
        return function () { return _this.unsubscribe(handler); };
    };
    Subscribable.prototype.unsubscribe = function (handler) {
        var index = this._subscribers.indexOf(handler);
        if (index >= 0) {
            this._subscribers.splice(index, 1);
            return true;
        }
        return false;
    };
    Subscribable.prototype.unsubscribeAll = function () {
        var count = this._subscribers.length;
        this._subscribers = [];
        return count;
    };
    return Subscribable;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Subscribable;

},{}],32:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require("./abstract");
var ObservableValue = (function (_super) {
    __extends(ObservableValue, _super);
    function ObservableValue(initialValue) {
        _super.call(this);
        this._value = initialValue;
    }
    ObservableValue.prototype.get = function () {
        return this._value;
    };
    ObservableValue.prototype.set = function (value, noTrigger, caller) {
        if (noTrigger === void 0) { noTrigger = false; }
        var oldValue = this._value;
        this._value = value;
        if (!noTrigger) {
            this._trigger(value, oldValue, caller);
        }
    };
    return ObservableValue;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableValue;

},{"./abstract":15}],33:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require("./abstract");
var helpers_1 = require('./helpers');
var ObservableView = (function (_super) {
    __extends(ObservableView, _super);
    function ObservableView(observable, converter) {
        var _this = this;
        _super.call(this);
        this.observable = observable;
        this.converter = converter;
        helpers_1.subscribe(observable, converter, function (newValue, oldValue, caller) {
            _this._trigger(newValue, oldValue, caller);
        });
    }
    ObservableView.prototype.get = function () {
        return helpers_1.getSubscribedValue(this.observable, this.converter);
    };
    ObservableView.bindTo = function (observable, converter) {
        return new ObservableView(observable, converter);
    };
    return ObservableView;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObservableView;

},{"./abstract":15,"./helpers":22}],34:[function(require,module,exports){
var helpers_1 = require('../observable/helpers');
var selection_1 = require("../selection");
var unbind_1 = require('../bindings/unbind');
var logger_1 = require('../utils/logger');
function redraw(selection, observable, renderer) {
    selection.selectAll("*").remove();
    if (observable instanceof Array) {
        renderer.apply(selection, observable.map(function (item) { return item.get(); }).concat(selection));
    }
    else {
        renderer.call(selection, observable.get(), selection);
    }
}
function bindRedraw(observable, renderer) {
    var _this = this;
    var logger = logger_1.default.get('Selection', 'redraw');
    redraw(this, observable, renderer);
    var unsubscribeFunc = helpers_1.subscribe(observable, function () { return null; }, function (newValue, oldValue, caller) {
        logger.log('caller:', caller, '| node:', _this.node());
        redraw(_this, observable, renderer);
    });
    unbind_1.setUnbindForSelectionField(this, 'redraw', unsubscribeFunc);
    return this;
}
selection_1.default.bindRedraw = bindRedraw;
selection_1.default.unbindRedraw = function () {
    unbind_1.unbindSelectionField(this, 'redraw');
    return this;
};

},{"../bindings/unbind":3,"../observable/helpers":22,"../selection":44,"../utils/logger":46}],35:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require('../observable/abstract');
var BindRepeatDatumProxy = (function (_super) {
    __extends(BindRepeatDatumProxy, _super);
    function BindRepeatDatumProxy(id, bindRepeat) {
        _super.call(this);
        this.id = id;
        this.bindRepeat = bindRepeat;
    }
    BindRepeatDatumProxy.prototype._trigger = function (newValue, oldValue, caller) {
        _super.prototype._trigger.call(this, newValue, oldValue, caller);
    };
    BindRepeatDatumProxy.prototype.get = function () {
        var index = this.bindRepeat.getCurrentValueOfItem(this.id);
        return this.bindRepeat.modelList.get(index);
    };
    BindRepeatDatumProxy.prototype.set = function (value, noTrigger, caller) {
        if (noTrigger === void 0) { noTrigger = false; }
        var index = this.bindRepeat.getCurrentValueOfItem(this.id);
        this.bindRepeat.modelList.set(index, value, noTrigger, caller);
    };
    return BindRepeatDatumProxy;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BindRepeatDatumProxy;

},{"../observable/abstract":15}],36:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstract_1 = require('../observable/abstract');
var BindRepeatIndexProxy = (function (_super) {
    __extends(BindRepeatIndexProxy, _super);
    function BindRepeatIndexProxy(id, bindRepeat) {
        _super.call(this);
        this.id = id;
        this.bindRepeat = bindRepeat;
    }
    BindRepeatIndexProxy.prototype._trigger = function (caller) {
        var _a = this.bindRepeat.getCurrentAndPreviousValueOfItem(this.id), newValue = _a.newValue, oldValue = _a.oldValue;
        _super.prototype._trigger.call(this, newValue, oldValue, caller);
    };
    BindRepeatIndexProxy.prototype._getSubscriberCount = function () {
        return this._subscribers.length;
    };
    BindRepeatIndexProxy.prototype.get = function () {
        return this.bindRepeat.getCurrentValueOfItem(this.id);
    };
    return BindRepeatIndexProxy;
})(abstract_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BindRepeatIndexProxy;

},{"../observable/abstract":15}],37:[function(require,module,exports){
var selection_1 = require("../selection");
var bind_repeat_index_1 = require('./bind-repeat-index');
var bind_repeat_datum_1 = require("./bind-repeat-datum");
var unbind_1 = require('../bindings/unbind');
var logger_1 = require('../utils/logger');
var REPEAT_PREFIX = '__d3bind_repeat';
var BindRepeatEvent;
(function (BindRepeatEvent) {
    BindRepeatEvent[BindRepeatEvent["BUILD"] = 0] = "BUILD";
    BindRepeatEvent[BindRepeatEvent["INSERT"] = 1] = "INSERT";
    BindRepeatEvent[BindRepeatEvent["REMOVE"] = 2] = "REMOVE";
    BindRepeatEvent[BindRepeatEvent["REPLACE"] = 3] = "REPLACE";
    BindRepeatEvent[BindRepeatEvent["INSERT_REINDEXING"] = 4] = "INSERT_REINDEXING";
    BindRepeatEvent[BindRepeatEvent["REMOVE_REINDEXING"] = 5] = "REMOVE_REINDEXING";
})(BindRepeatEvent || (BindRepeatEvent = {}));
var BindRepeat = (function () {
    function BindRepeat(modelList, renderer, options, selection) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.modelList = modelList;
        this.renderer = renderer;
        this.options = options;
        this.selection = selection;
        this.repeatItems = [];
        this.repeatItemsById = {};
        this.itemCounter = 0;
        this.logger = logger_1.default.get('Selection', 'repeat');
        this.selectionProxy = this.createSelectionProxy();
        this.build();
        var unsubscribeFunc = modelList.subscribe({
            insert: function (item, index) { _this.onInsert(item, index); },
            remove: function (item, index) { _this.onRemove(item, index); },
            replace: options.customReplace ? function (item, index, oldValue, caller) { _this.onReplace(item, index, oldValue, caller); } : undefined
        });
        unbind_1.setUnbindForSelectionField(selection, 'repeat', function () { return unsubscribeFunc() ? 1 : 0; });
    }
    BindRepeat.prototype.createRepeatItem = function () {
        var id = this.itemCounter++;
        var indexProxy = new bind_repeat_index_1.default(id, this);
        var datumProxy = this.options.customReplace ? new bind_repeat_datum_1.default(id, this) : null;
        var repeatItem = {
            id: id,
            selection: null,
            indexProxy: indexProxy,
            datumProxy: datumProxy,
            index: this.currentIndex
        };
        if (this.currentIndex === this.repeatItems.length) {
            this.repeatItems.push(repeatItem);
        }
        else {
            this.repeatItems.splice(this.currentIndex, 0, repeatItem);
        }
        this.repeatItemsById[id] = repeatItem;
        return repeatItem;
    };
    BindRepeat.prototype.build = function () {
        this.currentEvent = BindRepeatEvent.BUILD;
        for (this.currentIndex = 0; this.currentIndex < this.modelList.length; this.currentIndex++) {
            var repeatItem = this.createRepeatItem();
            var modelItem = this.modelList.get(this.currentIndex);
            var rendererItem = this.options.customReplace ? repeatItem.datumProxy : modelItem;
            this.renderer.call(this.selectionProxy, rendererItem, repeatItem.indexProxy, this.selectionProxy);
        }
        this.currentEvent = null;
        this.currentIndex = null;
    };
    BindRepeat.prototype.onInsert = function (item, index) {
        this.currentEvent = BindRepeatEvent.INSERT;
        this.currentIndex = index;
        var repeatItem = this.createRepeatItem();
        var rendererItem = this.options.customReplace ? repeatItem.datumProxy : item;
        this.renderer.call(this.selectionProxy, rendererItem, repeatItem.indexProxy, this.selectionProxy);
        this.logger.log('insert:', item, '| index:', index, '| node:', repeatItem.selection.node());
        this.currentEvent = BindRepeatEvent.INSERT_REINDEXING;
        this.currentIndex++;
        this.updateIndexes();
        this.currentEvent = null;
        this.currentIndex = null;
    };
    BindRepeat.prototype.onRemove = function (item, index) {
        this.currentEvent = BindRepeatEvent.REMOVE;
        this.currentIndex = index;
        var itemToRemove = this.repeatItems.splice(index, 1)[0];
        delete this.repeatItemsById[itemToRemove.id];
        this.logger.log('remove:', item, '| index:', index, '| node:', itemToRemove.selection.node());
        if (this.options.customRemove) {
            this.options.customRemove.call(itemToRemove.selection, item, index, itemToRemove.selection);
        }
        else {
            itemToRemove.selection.remove();
        }
        itemToRemove.indexProxy.unsubscribeAll();
        if (itemToRemove.datumProxy) {
            itemToRemove.datumProxy.unsubscribeAll();
        }
        this.currentEvent = BindRepeatEvent.REMOVE_REINDEXING;
        this.updateIndexes();
        this.currentEvent = null;
        this.currentIndex = null;
    };
    BindRepeat.prototype.onReplace = function (item, index, oldValue, caller) {
        this.currentEvent = BindRepeatEvent.REPLACE;
        this.currentIndex = index;
        var repeatItem = this.repeatItems[index];
        this.logger.log('replace:', item, '| index:', index, '| oldValue:', oldValue, '| caller:', caller, ' node:', repeatItem.selection.node());
        repeatItem.datumProxy._trigger(item, oldValue, caller);
        this.currentEvent = null;
        this.currentIndex = null;
    };
    BindRepeat.prototype.updateIndexes = function () {
        for (; this.currentIndex < this.repeatItems.length; this.currentIndex++) {
            this.repeatItems[this.currentIndex].index = this.currentIndex;
            if (this.repeatItems[this.currentIndex].indexProxy._getSubscriberCount() > 0) {
                this.repeatItems[this.currentIndex].indexProxy._trigger();
            }
        }
    };
    BindRepeat.prototype.getCurrentValueOfItem = function (id) {
        if (this.currentIndex !== null) {
            return this.currentIndex;
        }
        else {
            var index = this.repeatItemsById[id] && this.repeatItemsById[id].index;
            if (index == null)
                console.warn("bindRepeat index not found!");
            return index;
        }
    };
    BindRepeat.prototype.getCurrentAndPreviousValueOfItem = function (id) {
        var newValue = this.getCurrentValueOfItem(id);
        var oldValue = null;
        if (this.currentEvent === null || BindRepeatEvent.REPLACE) {
            oldValue = newValue;
        }
        else if (this.currentEvent === BindRepeatEvent.INSERT || this.currentEvent === BindRepeatEvent.REMOVE ||
            this.currentEvent === BindRepeatEvent.BUILD) {
            oldValue = null;
        }
        else if (this.currentEvent === BindRepeatEvent.INSERT_REINDEXING ||
            this.currentEvent === BindRepeatEvent.REMOVE_REINDEXING) {
            oldValue = this.currentIndex - 1;
        }
        return { newValue: newValue, oldValue: oldValue };
    };
    BindRepeat.prototype.createSelectionProxy = function () {
        var _this = this;
        var proxy = Object.create(this.selection);
        proxy.append = function (input) {
            return _this.insertRepeatItem(input);
        };
        proxy.insert = function (input, before) {
            if (before !== undefined)
                throw "before parameter of .insert() not supported inside bindRepeat";
            return _this.insertRepeatItem(input);
        };
        return proxy;
    };
    BindRepeat.prototype.insertRepeatItem = function (input) {
        var _this = this;
        if (this.currentIndex == null) {
            throw "the bindRepeat render function must call the append/insert method synchronously!";
        }
        var i = this.currentIndex;
        var newItem = null;
        if (i >= this.repeatItems.length) {
            newItem = this.selection.append(input);
        }
        else {
            newItem = this.selection.insert(input, function () { return _this.selection.node().childNodes[i]; });
        }
        this.repeatItems[i].selection = newItem;
        return newItem;
    };
    return BindRepeat;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BindRepeat;
function bindRepeat(modelList, renderer, options) {
    this.node()[REPEAT_PREFIX] = new BindRepeat(modelList, renderer, options, this);
    return this;
}
selection_1.default.bindRepeat = bindRepeat;
selection_1.default.unbindRepeat = function () {
    unbind_1.unbindSelectionField(this, 'repeat');
    var repeatItems = this.node()[REPEAT_PREFIX].repeatItems;
    repeatItems.forEach(function (repeatItem) {
        repeatItem.indexProxy.unsubscribeAll();
        if (repeatItem.datumProxy) {
            repeatItem.datumProxy.unsubscribeAll();
        }
    });
    return this;
};

},{"../bindings/unbind":3,"../selection":44,"../utils/logger":46,"./bind-repeat-datum":35,"./bind-repeat-index":36}],38:[function(require,module,exports){
var selection_1 = require("../selection");
selection_1.default.repeat = function (modelList, renderer) {
    for (var i = 0; i < modelList.length; i++) {
        renderer.call(this, modelList[i], i, this);
    }
    return this;
};

},{"../selection":44}],39:[function(require,module,exports){
var d3bind = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = d3bind;

},{}],40:[function(require,module,exports){
var converters_1 = require('../observable/converters');
var root_1 = require('../root');
root_1.default.observable = function (object) {
    return converters_1.toObservable(object);
};
root_1.default.deepObservable = function (object) {
    return converters_1.toDeepObservable(object);
};

},{"../observable/converters":21,"../root":39}],41:[function(require,module,exports){
var root_1 = require('../root');
var logger_1 = require('../utils/logger');
var scales_wrapper_1 = require('../scales/scales-wrapper');
var array_1 = require('../observable/array');
var map_1 = require('../observable/map');
var set_1 = require('../observable/set');
var value_1 = require('../observable/value');
var view_1 = require('../observable/view');
root_1.default.ObservableArray = array_1.default;
root_1.default.ObservableMap = map_1.default;
root_1.default.ObservableSet = set_1.default;
root_1.default.ObservableValue = value_1.default;
root_1.default.ObservableView = view_1.default;
root_1.default.scale = scales_wrapper_1.scales;
root_1.default.time = { scale: scales_wrapper_1.timeScales };
Object.defineProperty(root_1.default, 'logging', {
    get: function () { return logger_1.default.enabled; },
    set: function (value) { return logger_1.default.enabled = value; }
});

},{"../observable/array":20,"../observable/map":25,"../observable/set":30,"../observable/value":32,"../observable/view":33,"../root":39,"../scales/scales-wrapper":43,"../utils/logger":46}],42:[function(require,module,exports){
var root_1 = require('../root');
var override_utils_1 = require('../core/override-utils');
root_1.default.wrap = function (d3Selection) {
    return override_utils_1.addBindingFunctionsToSelection(d3Selection);
};

},{"../core/override-utils":5,"../root":39}],43:[function(require,module,exports){
var setter_1 = require('../bindings/setter');
var unbind_1 = require('../bindings/unbind');
function observableScale(source, ctor) {
    var scale = function (x) { return source(x); };
    setter_1.addObservableSetter(source, scale, 'domain');
    setter_1.addObservableSetter(source, scale, 'range');
    scale.copy = function () { return ctor(source.copy()); };
    scale.unbindAll = function () {
        unbind_1.unbindObject(scale);
        return scale;
    };
    return scale;
}
function observableInvertibleScale(source, ctor) {
    var scale = observableScale(source, ctor);
    scale.invert = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return source.invert.apply(source, args);
    };
    scale.ticks = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return source.ticks.apply(source, args);
    };
    scale.tickFormat = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return source.tickFormat.apply(source, args);
    };
    return scale;
}
function observableUninvertibleScale(source, ctor) {
    var scale = observableScale(source, ctor);
    scale.invertExtent = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return source.invertExtent.apply(source, args);
    };
    return scale;
}
function observableMathScale(source, ctor) {
    var scale = observableInvertibleScale(source, ctor);
    setter_1.addObservableSetter(source, scale, 'interpolate');
    setter_1.addObservableSetter(source, scale, 'clamp');
    scale.nice = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        source.nice.apply(source, args);
        scale.$domain.trigger();
        return scale;
    };
    scale.rangeRound = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        source.rangeRound.apply(source, args);
        scale.$range.trigger();
        scale.$interpolate.trigger();
        return scale;
    };
    return scale;
}
function observableLinearScale(source) {
    return observableMathScale(source, observableLinearScale);
}
function observablePowScale(source) {
    var scale = observableMathScale(source, observablePowScale);
    setter_1.addObservableSetter(source, scale, 'exponent');
    return scale;
}
function observableLogScale(source) {
    var scale = observableMathScale(source, observableLogScale);
    setter_1.addObservableSetter(source, scale, 'base');
    return scale;
}
function observableIdentityScale(source) {
    return observableInvertibleScale(source, observableIdentityScale);
}
function observableQuantizeScale(source) {
    return observableUninvertibleScale(source, observableQuantizeScale);
}
function observableQuantileScale(source) {
    var scale = observableUninvertibleScale(source, observableQuantileScale);
    scale.quantiles = function () { return source.quantiles(); };
    return scale;
}
function observableThresholdScale(source) {
    return observableUninvertibleScale(source, observableThresholdScale);
}
function observableOrdinalScale(source) {
    var scale = observableScale(source, observableOrdinalScale);
    scale.rangePoints = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        source.rangePoints.apply(source, args);
        scale.$range.trigger();
        return scale;
    };
    scale.rangeRoundPoints = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        source.rangeRoundPoints.apply(source, args);
        scale.$range.trigger();
        return scale;
    };
    scale.rangeBands = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        source.rangeBands.apply(source, args);
        scale.$range.trigger();
        return scale;
    };
    scale.rangeRoundBands = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        source.rangeRoundBands.apply(source, args);
        scale.$range.trigger();
        return scale;
    };
    scale.rangeBand = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return source.rangeBand.apply(source, args);
    };
    scale.rangeExtent = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return source.rangeExtent.apply(source, args);
    };
    return scale;
}
function observableTimeScale(source) {
    return observableMathScale(source, observableTimeScale);
}
exports.scales = {
    linear: function () { return observableLinearScale(d3.scale.linear()); },
    pow: function () { return observablePowScale(d3.scale.pow()); },
    sqrt: function () { return observablePowScale(d3.scale.sqrt()); },
    log: function () { return observableLogScale(d3.scale.log()); },
    identity: function () { return observableIdentityScale(d3.scale.identity()); },
    quantize: function () { return observableQuantizeScale(d3.scale.quantize()); },
    quantile: function () { return observableQuantileScale(d3.scale.quantile()); },
    threshold: function () { return observableThresholdScale(d3.scale.threshold()); },
    ordinal: function () { return observableOrdinalScale(d3.scale.ordinal()); },
    category10: function () { return observableOrdinalScale(d3.scale.category10()); },
    category20: function () { return observableOrdinalScale(d3.scale.category20()); },
    category20b: function () { return observableOrdinalScale(d3.scale.category20b()); },
    category20c: function () { return observableOrdinalScale(d3.scale.category20c()); }
};
exports.timeScales = function () { return observableTimeScale(d3.time.scale()); };
exports.timeScales.utc = function () { return observableTimeScale(d3.time.scale.utc()); };

},{"../bindings/setter":2,"../bindings/unbind":3}],44:[function(require,module,exports){
var selectionTemplate = {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = selectionTemplate;

},{}],45:[function(require,module,exports){
var root_1 = require('../root');
var TRANSITION_PREFIX = 'd3bind_global_';
var sequence = 0;
var D3BindGlobalTransition = (function () {
    function D3BindGlobalTransition() {
        this._id = sequence++;
        this._eventHandlers = {
            start: [],
            end: [],
            interrupt: []
        };
    }
    D3BindGlobalTransition.prototype.delay = function (delay) {
        if (delay !== undefined) {
            this._delay = delay;
            return this;
        }
        else {
            return this._delay;
        }
    };
    D3BindGlobalTransition.prototype.duration = function (duration) {
        if (duration !== undefined) {
            this._duration = duration;
            return this;
        }
        else {
            return this._duration;
        }
    };
    D3BindGlobalTransition.prototype.ease = function (value) {
        if (value !== undefined) {
            this._ease = value;
            return this;
        }
        else {
            return this._ease;
        }
    };
    D3BindGlobalTransition.prototype.run = function (listener) {
        var _this = this;
        var t = d3.select(document).transition(TRANSITION_PREFIX + this._id);
        if (this._delay !== undefined) {
            t.delay(this._delay);
        }
        if (this._duration !== undefined) {
            t.duration(this._duration);
        }
        if (this._ease !== undefined) {
            t.ease(this._ease);
        }
        ['start', 'end', 'interrupt'].forEach(function (type) {
            if (_this._eventHandlers[type].length > 0) {
                t.each(type, function () {
                    _this._eventHandlers[type].forEach(function (handler) { handler.call(null); });
                });
            }
        });
        t.tween(TRANSITION_PREFIX + this._id, function () { return listener; });
    };
    D3BindGlobalTransition.prototype.on = function (type, eventHandler) {
        this._eventHandlers[type].push(eventHandler);
        return this;
    };
    return D3BindGlobalTransition;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = D3BindGlobalTransition;
root_1.default.transition = function () {
    return new D3BindGlobalTransition();
};

},{"../root":39}],46:[function(require,module,exports){
var INDENT_SIZE = 2;
var Logger = (function () {
    function Logger(type, name) {
        this.type = type;
        this.name = name;
    }
    Logger.prototype.logIndent = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        if (Logger._enabled) {
            this._log.apply(this, params);
            Logger._depth += INDENT_SIZE;
        }
    };
    Logger.prototype.logUnindent = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        if (Logger._enabled) {
            if (params.length > 0) {
                this._log.apply(this, params);
            }
            Logger._depth -= INDENT_SIZE;
        }
    };
    Logger.prototype.log = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        if (Logger._enabled) {
            this._log.apply(this, params);
        }
    };
    Logger.prototype._log = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        var prefix = (Logger._depth === 0 ? '\n' : '') + new Array(Logger._depth + 1).join(' ') +
            this.type + (this.name ? '(' + this.name + ')' : '') + ': ';
        console.log.apply(console, [prefix].concat(params));
    };
    Object.defineProperty(Logger, "enabled", {
        get: function () {
            return this._enabled;
        },
        set: function (value) {
            this._enabled = value;
            this._depth = 0;
        },
        enumerable: true,
        configurable: true
    });
    Logger.get = function (type, name) {
        return new Logger(type, name);
    };
    Logger._depth = 0;
    Logger._enabled = false;
    return Logger;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Logger;

},{}]},{},[14])(14)
});
//# sourceMappingURL=d3bind.js.map

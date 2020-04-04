module.exports =
/******/ (function(modules, runtime) { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	__webpack_require__.ab = __dirname + "/";
/******/
/******/ 	// the startup function
/******/ 	function startup() {
/******/ 		// Load entry module and return exports
/******/ 		return __webpack_require__(73);
/******/ 	};
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module) {

/**
 * lodash 4.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' ||
    (!isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag);
}

module.exports = isString;


/***/ }),
/* 1 */,
/* 2 */,
/* 3 */
/***/ (function(module, __unusedexports, __webpack_require__) {

var Stream = __webpack_require__(413).Stream;
var util = __webpack_require__(669);

module.exports = DelayedStream;
function DelayedStream() {
  this.source = null;
  this.dataSize = 0;
  this.maxDataSize = 1024 * 1024;
  this.pauseStream = true;

  this._maxDataSizeExceeded = false;
  this._released = false;
  this._bufferedEvents = [];
}
util.inherits(DelayedStream, Stream);

DelayedStream.create = function(source, options) {
  var delayedStream = new this();

  options = options || {};
  for (var option in options) {
    delayedStream[option] = options[option];
  }

  delayedStream.source = source;

  var realEmit = source.emit;
  source.emit = function() {
    delayedStream._handleEmit(arguments);
    return realEmit.apply(source, arguments);
  };

  source.on('error', function() {});
  if (delayedStream.pauseStream) {
    source.pause();
  }

  return delayedStream;
};

Object.defineProperty(DelayedStream.prototype, 'readable', {
  configurable: true,
  enumerable: true,
  get: function() {
    return this.source.readable;
  }
});

DelayedStream.prototype.setEncoding = function() {
  return this.source.setEncoding.apply(this.source, arguments);
};

DelayedStream.prototype.resume = function() {
  if (!this._released) {
    this.release();
  }

  this.source.resume();
};

DelayedStream.prototype.pause = function() {
  this.source.pause();
};

DelayedStream.prototype.release = function() {
  this._released = true;

  this._bufferedEvents.forEach(function(args) {
    this.emit.apply(this, args);
  }.bind(this));
  this._bufferedEvents = [];
};

DelayedStream.prototype.pipe = function() {
  var r = Stream.prototype.pipe.apply(this, arguments);
  this.resume();
  return r;
};

DelayedStream.prototype._handleEmit = function(args) {
  if (this._released) {
    this.emit.apply(this, args);
    return;
  }

  if (args[0] === 'data') {
    this.dataSize += args[1].length;
    this._checkIfMaxDataSizeExceeded();
  }

  this._bufferedEvents.push(args);
};

DelayedStream.prototype._checkIfMaxDataSizeExceeded = function() {
  if (this._maxDataSizeExceeded) {
    return;
  }

  if (this.dataSize <= this.maxDataSize) {
    return;
  }

  this._maxDataSizeExceeded = true;
  var message =
    'DelayedStream#maxDataSize of ' + this.maxDataSize + ' bytes exceeded.'
  this.emit('error', new Error(message));
};


/***/ }),
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */
/***/ (function(module) {

// API
module.exports = state;

/**
 * Creates initial state object
 * for iteration over list
 *
 * @param   {array|object} list - list to iterate over
 * @param   {function|null} sortMethod - function to use for keys sort,
 *                                     or `null` to keep them as is
 * @returns {object} - initial state object
 */
function state(list, sortMethod)
{
  var isNamedList = !Array.isArray(list)
    , initState =
    {
      index    : 0,
      keyedList: isNamedList || sortMethod ? Object.keys(list) : null,
      jobs     : {},
      results  : isNamedList ? {} : [],
      size     : isNamedList ? Object.keys(list).length : list.length
    }
    ;

  if (sortMethod)
  {
    // sort array keys based on it's values
    // sort object's keys just on own merit
    initState.keyedList.sort(isNamedList ? sortMethod : function(a, b)
    {
      return sortMethod(list[a], list[b]);
    });
  }

  return initState;
}


/***/ }),
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */
/***/ (function(module) {

module.exports = {"$id":"timings.json#","$schema":"http://json-schema.org/draft-06/schema#","required":["send","wait","receive"],"properties":{"dns":{"type":"number","min":-1},"connect":{"type":"number","min":-1},"blocked":{"type":"number","min":-1},"send":{"type":"number","min":-1},"wait":{"type":"number","min":-1},"receive":{"type":"number","min":-1},"ssl":{"type":"number","min":-1},"comment":{"type":"string"}}};

/***/ }),
/* 15 */,
/* 16 */
/***/ (function(module) {

module.exports = require("tls");

/***/ }),
/* 17 */,
/* 18 */,
/* 19 */
/***/ (function(module) {

"use strict";


function getParamSize(keySize) {
	var result = ((keySize / 8) | 0) + (keySize % 8 === 0 ? 0 : 1);
	return result;
}

var paramBytesForAlg = {
	ES256: getParamSize(256),
	ES384: getParamSize(384),
	ES512: getParamSize(521)
};

function getParamBytesForAlg(alg) {
	var paramBytes = paramBytesForAlg[alg];
	if (paramBytes) {
		return paramBytes;
	}

	throw new Error('Unknown algorithm "' + alg + '"');
}

module.exports = getParamBytesForAlg;


/***/ }),
/* 20 */,
/* 21 */
/***/ (function(module, __unusedexports, __webpack_require__) {

var JsonWebTokenError = __webpack_require__(624);

var TokenExpiredError = function (message, expiredAt) {
  JsonWebTokenError.call(this, message);
  this.name = 'TokenExpiredError';
  this.expiredAt = expiredAt;
};

TokenExpiredError.prototype = Object.create(JsonWebTokenError.prototype);

TokenExpiredError.prototype.constructor = TokenExpiredError;

module.exports = TokenExpiredError;

/***/ }),
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */,
/* 34 */,
/* 35 */,
/* 36 */,
/* 37 */,
/* 38 */
/***/ (function(module) {

"use strict";


var replace = String.prototype.replace;
var percentTwenties = /%20/g;

module.exports = {
    'default': 'RFC3986',
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return value;
        }
    },
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};


/***/ }),
/* 39 */
/***/ (function(module) {

"use strict";

module.exports = function generate__limitLength(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $op = $keyword == 'maxLength' ? '>' : '<';
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
  }
  if (it.opts.unicode === false) {
    out += ' ' + ($data) + '.length ';
  } else {
    out += ' ucs2length(' + ($data) + ') ';
  }
  out += ' ' + ($op) + ' ' + ($schemaValue) + ') { ';
  var $errorKeyword = $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limitLength') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should NOT be ';
      if ($keyword == 'maxLength') {
        out += 'longer';
      } else {
        out += 'shorter';
      }
      out += ' than ';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + ($schema);
      }
      out += ' characters\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),
/* 40 */,
/* 41 */
/***/ (function(module) {

"use strict";

module.exports = function generate__limitItems(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $op = $keyword == 'maxItems' ? '>' : '<';
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
  }
  out += ' ' + ($data) + '.length ' + ($op) + ' ' + ($schemaValue) + ') { ';
  var $errorKeyword = $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limitItems') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should NOT have ';
      if ($keyword == 'maxItems') {
        out += 'more';
      } else {
        out += 'fewer';
      }
      out += ' than ';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + ($schema);
      }
      out += ' items\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),
/* 42 */,
/* 43 */,
/* 44 */,
/* 45 */,
/* 46 */
/***/ (function(module) {

"use strict";


module.exports = function (data, opts) {
    if (!opts) opts = {};
    if (typeof opts === 'function') opts = { cmp: opts };
    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

    var cmp = opts.cmp && (function (f) {
        return function (node) {
            return function (a, b) {
                var aobj = { key: a, value: node[a] };
                var bobj = { key: b, value: node[b] };
                return f(aobj, bobj);
            };
        };
    })(opts.cmp);

    var seen = [];
    return (function stringify (node) {
        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }

        if (node === undefined) return;
        if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
        if (typeof node !== 'object') return JSON.stringify(node);

        var i, out;
        if (Array.isArray(node)) {
            out = '[';
            for (i = 0; i < node.length; i++) {
                if (i) out += ',';
                out += stringify(node[i]) || 'null';
            }
            return out + ']';
        }

        if (node === null) return 'null';

        if (seen.indexOf(node) !== -1) {
            if (cycles) return JSON.stringify('__cycle__');
            throw new TypeError('Converting circular structure to JSON');
        }

        var seenIndex = seen.push(node) - 1;
        var keys = Object.keys(node).sort(cmp && cmp(node));
        out = '';
        for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = stringify(node[key]);

            if (!value) continue;
            if (out) out += ',';
            out += JSON.stringify(key) + ':' + value;
        }
        seen.splice(seenIndex, 1);
        return '{' + out + '}';
    })(data);
};


/***/ }),
/* 47 */,
/* 48 */
/***/ (function(module) {

// Generated by CoffeeScript 1.12.2
(function() {
  var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - nodeLoadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    moduleLoadTime = getNanoSeconds();
    upTime = process.uptime() * 1e9;
    nodeLoadTime = moduleLoadTime - upTime;
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

//# sourceMappingURL=performance-now.js.map


/***/ }),
/* 49 */
/***/ (function(module) {

"use strict";

module.exports = function generate__limitProperties(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $op = $keyword == 'maxProperties' ? '>' : '<';
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
  }
  out += ' Object.keys(' + ($data) + ').length ' + ($op) + ' ' + ($schemaValue) + ') { ';
  var $errorKeyword = $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limitProperties') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should NOT have ';
      if ($keyword == 'maxProperties') {
        out += 'more';
      } else {
        out += 'fewer';
      }
      out += ' than ';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + ($schema);
      }
      out += ' properties\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}


/***/ }),
/* 50 */,
/* 51 */,
/* 52 */,
/* 53 */,
/* 54 */,
/* 55 */,
/* 56 */,
/* 57 */,
/* 58 */,
/* 59 */
/***/ (function(module, __unusedexports, __webpack_require__) {

// Copyright 2017 Joyent, Inc.

module.exports = {
	read: read,
	verify: verify,
	sign: sign,
	signAsync: signAsync,
	write: write
};

var assert = __webpack_require__(522);
var asn1 = __webpack_require__(632);
var Buffer = __webpack_require__(585).Buffer;
var algs = __webpack_require__(626);
var utils = __webpack_require__(541);
var Key = __webpack_require__(344);
var PrivateKey = __webpack_require__(149);
var pem = __webpack_require__(819);
var Identity = __webpack_require__(528);
var Signature = __webpack_require__(490);
var Certificate = __webpack_require__(562);
var pkcs8 = __webpack_require__(123);

/*
 * This file is based on RFC5280 (X.509).
 */

/* Helper to read in a single mpint */
function readMPInt(der, nm) {
	assert.strictEqual(der.peek(), asn1.Ber.Integer,
	    nm + ' is not an Integer');
	return (utils.mpNormalize(der.readString(asn1.Ber.Integer, true)));
}

function verify(cert, key) {
	var sig = cert.signatures.x509;
	assert.object(sig, 'x509 signature');

	var algParts = sig.algo.split('-');
	if (algParts[0] !== key.type)
		return (false);

	var blob = sig.cache;
	if (blob === undefined) {
		var der = new asn1.BerWriter();
		writeTBSCert(cert, der);
		blob = der.buffer;
	}

	var verifier = key.createVerify(algParts[1]);
	verifier.write(blob);
	return (verifier.verify(sig.signature));
}

function Local(i) {
	return (asn1.Ber.Context | asn1.Ber.Constructor | i);
}

function Context(i) {
	return (asn1.Ber.Context | i);
}

var SIGN_ALGS = {
	'rsa-md5': '1.2.840.113549.1.1.4',
	'rsa-sha1': '1.2.840.113549.1.1.5',
	'rsa-sha256': '1.2.840.113549.1.1.11',
	'rsa-sha384': '1.2.840.113549.1.1.12',
	'rsa-sha512': '1.2.840.113549.1.1.13',
	'dsa-sha1': '1.2.840.10040.4.3',
	'dsa-sha256': '2.16.840.1.101.3.4.3.2',
	'ecdsa-sha1': '1.2.840.10045.4.1',
	'ecdsa-sha256': '1.2.840.10045.4.3.2',
	'ecdsa-sha384': '1.2.840.10045.4.3.3',
	'ecdsa-sha512': '1.2.840.10045.4.3.4',
	'ed25519-sha512': '1.3.101.112'
};
Object.keys(SIGN_ALGS).forEach(function (k) {
	SIGN_ALGS[SIGN_ALGS[k]] = k;
});
SIGN_ALGS['1.3.14.3.2.3'] = 'rsa-md5';
SIGN_ALGS['1.3.14.3.2.29'] = 'rsa-sha1';

var EXTS = {
	'issuerKeyId': '2.5.29.35',
	'altName': '2.5.29.17',
	'basicConstraints': '2.5.29.19',
	'keyUsage': '2.5.29.15',
	'extKeyUsage': '2.5.29.37'
};

function read(buf, options) {
	if (typeof (buf) === 'string') {
		buf = Buffer.from(buf, 'binary');
	}
	assert.buffer(buf, 'buf');

	var der = new asn1.BerReader(buf);

	der.readSequence();
	if (Math.abs(der.length - der.remain) > 1) {
		throw (new Error('DER sequence does not contain whole byte ' +
		    'stream'));
	}

	var tbsStart = der.offset;
	der.readSequence();
	var sigOffset = der.offset + der.length;
	var tbsEnd = sigOffset;

	if (der.peek() === Local(0)) {
		der.readSequence(Local(0));
		var version = der.readInt();
		assert.ok(version <= 3,
		    'only x.509 versions up to v3 supported');
	}

	var cert = {};
	cert.signatures = {};
	var sig = (cert.signatures.x509 = {});
	sig.extras = {};

	cert.serial = readMPInt(der, 'serial');

	der.readSequence();
	var after = der.offset + der.length;
	var certAlgOid = der.readOID();
	var certAlg = SIGN_ALGS[certAlgOid];
	if (certAlg === undefined)
		throw (new Error('unknown signature algorithm ' + certAlgOid));

	der._offset = after;
	cert.issuer = Identity.parseAsn1(der);

	der.readSequence();
	cert.validFrom = readDate(der);
	cert.validUntil = readDate(der);

	cert.subjects = [Identity.parseAsn1(der)];

	der.readSequence();
	after = der.offset + der.length;
	cert.subjectKey = pkcs8.readPkcs8(undefined, 'public', der);
	der._offset = after;

	/* issuerUniqueID */
	if (der.peek() === Local(1)) {
		der.readSequence(Local(1));
		sig.extras.issuerUniqueID =
		    buf.slice(der.offset, der.offset + der.length);
		der._offset += der.length;
	}

	/* subjectUniqueID */
	if (der.peek() === Local(2)) {
		der.readSequence(Local(2));
		sig.extras.subjectUniqueID =
		    buf.slice(der.offset, der.offset + der.length);
		der._offset += der.length;
	}

	/* extensions */
	if (der.peek() === Local(3)) {
		der.readSequence(Local(3));
		var extEnd = der.offset + der.length;
		der.readSequence();

		while (der.offset < extEnd)
			readExtension(cert, buf, der);

		assert.strictEqual(der.offset, extEnd);
	}

	assert.strictEqual(der.offset, sigOffset);

	der.readSequence();
	after = der.offset + der.length;
	var sigAlgOid = der.readOID();
	var sigAlg = SIGN_ALGS[sigAlgOid];
	if (sigAlg === undefined)
		throw (new Error('unknown signature algorithm ' + sigAlgOid));
	der._offset = after;

	var sigData = der.readString(asn1.Ber.BitString, true);
	if (sigData[0] === 0)
		sigData = sigData.slice(1);
	var algParts = sigAlg.split('-');

	sig.signature = Signature.parse(sigData, algParts[0], 'asn1');
	sig.signature.hashAlgorithm = algParts[1];
	sig.algo = sigAlg;
	sig.cache = buf.slice(tbsStart, tbsEnd);

	return (new Certificate(cert));
}

function readDate(der) {
	if (der.peek() === asn1.Ber.UTCTime) {
		return (utcTimeToDate(der.readString(asn1.Ber.UTCTime)));
	} else if (der.peek() === asn1.Ber.GeneralizedTime) {
		return (gTimeToDate(der.readString(asn1.Ber.GeneralizedTime)));
	} else {
		throw (new Error('Unsupported date format'));
	}
}

function writeDate(der, date) {
	if (date.getUTCFullYear() >= 2050 || date.getUTCFullYear() < 1950) {
		der.writeString(dateToGTime(date), asn1.Ber.GeneralizedTime);
	} else {
		der.writeString(dateToUTCTime(date), asn1.Ber.UTCTime);
	}
}

/* RFC5280, section 4.2.1.6 (GeneralName type) */
var ALTNAME = {
	OtherName: Local(0),
	RFC822Name: Context(1),
	DNSName: Context(2),
	X400Address: Local(3),
	DirectoryName: Local(4),
	EDIPartyName: Local(5),
	URI: Context(6),
	IPAddress: Context(7),
	OID: Context(8)
};

/* RFC5280, section 4.2.1.12 (KeyPurposeId) */
var EXTPURPOSE = {
	'serverAuth': '1.3.6.1.5.5.7.3.1',
	'clientAuth': '1.3.6.1.5.5.7.3.2',
	'codeSigning': '1.3.6.1.5.5.7.3.3',

	/* See https://github.com/joyent/oid-docs/blob/master/root.md */
	'joyentDocker': '1.3.6.1.4.1.38678.1.4.1',
	'joyentCmon': '1.3.6.1.4.1.38678.1.4.2'
};
var EXTPURPOSE_REV = {};
Object.keys(EXTPURPOSE).forEach(function (k) {
	EXTPURPOSE_REV[EXTPURPOSE[k]] = k;
});

var KEYUSEBITS = [
	'signature', 'identity', 'keyEncryption',
	'encryption', 'keyAgreement', 'ca', 'crl'
];

function readExtension(cert, buf, der) {
	der.readSequence();
	var after = der.offset + der.length;
	var extId = der.readOID();
	var id;
	var sig = cert.signatures.x509;
	if (!sig.extras.exts)
		sig.extras.exts = [];

	var critical;
	if (der.peek() === asn1.Ber.Boolean)
		critical = der.readBoolean();

	switch (extId) {
	case (EXTS.basicConstraints):
		der.readSequence(asn1.Ber.OctetString);
		der.readSequence();
		var bcEnd = der.offset + der.length;
		var ca = false;
		if (der.peek() === asn1.Ber.Boolean)
			ca = der.readBoolean();
		if (cert.purposes === undefined)
			cert.purposes = [];
		if (ca === true)
			cert.purposes.push('ca');
		var bc = { oid: extId, critical: critical };
		if (der.offset < bcEnd && der.peek() === asn1.Ber.Integer)
			bc.pathLen = der.readInt();
		sig.extras.exts.push(bc);
		break;
	case (EXTS.extKeyUsage):
		der.readSequence(asn1.Ber.OctetString);
		der.readSequence();
		if (cert.purposes === undefined)
			cert.purposes = [];
		var ekEnd = der.offset + der.length;
		while (der.offset < ekEnd) {
			var oid = der.readOID();
			cert.purposes.push(EXTPURPOSE_REV[oid] || oid);
		}
		/*
		 * This is a bit of a hack: in the case where we have a cert
		 * that's only allowed to do serverAuth or clientAuth (and not
		 * the other), we want to make sure all our Subjects are of
		 * the right type. But we already parsed our Subjects and
		 * decided if they were hosts or users earlier (since it appears
		 * first in the cert).
		 *
		 * So we go through and mutate them into the right kind here if
		 * it doesn't match. This might not be hugely beneficial, as it
		 * seems that single-purpose certs are not often seen in the
		 * wild.
		 */
		if (cert.purposes.indexOf('serverAuth') !== -1 &&
		    cert.purposes.indexOf('clientAuth') === -1) {
			cert.subjects.forEach(function (ide) {
				if (ide.type !== 'host') {
					ide.type = 'host';
					ide.hostname = ide.uid ||
					    ide.email ||
					    ide.components[0].value;
				}
			});
		} else if (cert.purposes.indexOf('clientAuth') !== -1 &&
		    cert.purposes.indexOf('serverAuth') === -1) {
			cert.subjects.forEach(function (ide) {
				if (ide.type !== 'user') {
					ide.type = 'user';
					ide.uid = ide.hostname ||
					    ide.email ||
					    ide.components[0].value;
				}
			});
		}
		sig.extras.exts.push({ oid: extId, critical: critical });
		break;
	case (EXTS.keyUsage):
		der.readSequence(asn1.Ber.OctetString);
		var bits = der.readString(asn1.Ber.BitString, true);
		var setBits = readBitField(bits, KEYUSEBITS);
		setBits.forEach(function (bit) {
			if (cert.purposes === undefined)
				cert.purposes = [];
			if (cert.purposes.indexOf(bit) === -1)
				cert.purposes.push(bit);
		});
		sig.extras.exts.push({ oid: extId, critical: critical,
		    bits: bits });
		break;
	case (EXTS.altName):
		der.readSequence(asn1.Ber.OctetString);
		der.readSequence();
		var aeEnd = der.offset + der.length;
		while (der.offset < aeEnd) {
			switch (der.peek()) {
			case ALTNAME.OtherName:
			case ALTNAME.EDIPartyName:
				der.readSequence();
				der._offset += der.length;
				break;
			case ALTNAME.OID:
				der.readOID(ALTNAME.OID);
				break;
			case ALTNAME.RFC822Name:
				/* RFC822 specifies email addresses */
				var email = der.readString(ALTNAME.RFC822Name);
				id = Identity.forEmail(email);
				if (!cert.subjects[0].equals(id))
					cert.subjects.push(id);
				break;
			case ALTNAME.DirectoryName:
				der.readSequence(ALTNAME.DirectoryName);
				id = Identity.parseAsn1(der);
				if (!cert.subjects[0].equals(id))
					cert.subjects.push(id);
				break;
			case ALTNAME.DNSName:
				var host = der.readString(
				    ALTNAME.DNSName);
				id = Identity.forHost(host);
				if (!cert.subjects[0].equals(id))
					cert.subjects.push(id);
				break;
			default:
				der.readString(der.peek());
				break;
			}
		}
		sig.extras.exts.push({ oid: extId, critical: critical });
		break;
	default:
		sig.extras.exts.push({
			oid: extId,
			critical: critical,
			data: der.readString(asn1.Ber.OctetString, true)
		});
		break;
	}

	der._offset = after;
}

var UTCTIME_RE =
    /^([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})?Z$/;
function utcTimeToDate(t) {
	var m = t.match(UTCTIME_RE);
	assert.ok(m, 'timestamps must be in UTC');
	var d = new Date();

	var thisYear = d.getUTCFullYear();
	var century = Math.floor(thisYear / 100) * 100;

	var year = parseInt(m[1], 10);
	if (thisYear % 100 < 50 && year >= 60)
		year += (century - 1);
	else
		year += century;
	d.setUTCFullYear(year, parseInt(m[2], 10) - 1, parseInt(m[3], 10));
	d.setUTCHours(parseInt(m[4], 10), parseInt(m[5], 10));
	if (m[6] && m[6].length > 0)
		d.setUTCSeconds(parseInt(m[6], 10));
	return (d);
}

var GTIME_RE =
    /^([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})?Z$/;
function gTimeToDate(t) {
	var m = t.match(GTIME_RE);
	assert.ok(m);
	var d = new Date();

	d.setUTCFullYear(parseInt(m[1], 10), parseInt(m[2], 10) - 1,
	    parseInt(m[3], 10));
	d.setUTCHours(parseInt(m[4], 10), parseInt(m[5], 10));
	if (m[6] && m[6].length > 0)
		d.setUTCSeconds(parseInt(m[6], 10));
	return (d);
}

function zeroPad(n, m) {
	if (m === undefined)
		m = 2;
	var s = '' + n;
	while (s.length < m)
		s = '0' + s;
	return (s);
}

function dateToUTCTime(d) {
	var s = '';
	s += zeroPad(d.getUTCFullYear() % 100);
	s += zeroPad(d.getUTCMonth() + 1);
	s += zeroPad(d.getUTCDate());
	s += zeroPad(d.getUTCHours());
	s += zeroPad(d.getUTCMinutes());
	s += zeroPad(d.getUTCSeconds());
	s += 'Z';
	return (s);
}

function dateToGTime(d) {
	var s = '';
	s += zeroPad(d.getUTCFullYear(), 4);
	s += zeroPad(d.getUTCMonth() + 1);
	s += zeroPad(d.getUTCDate());
	s += zeroPad(d.getUTCHours());
	s += zeroPad(d.getUTCMinutes());
	s += zeroPad(d.getUTCSeconds());
	s += 'Z';
	return (s);
}

function sign(cert, key) {
	if (cert.signatures.x509 === undefined)
		cert.signatures.x509 = {};
	var sig = cert.signatures.x509;

	sig.algo = key.type + '-' + key.defaultHashAlgorithm();
	if (SIGN_ALGS[sig.algo] === undefined)
		return (false);

	var der = new asn1.BerWriter();
	writeTBSCert(cert, der);
	var blob = der.buffer;
	sig.cache = blob;

	var signer = key.createSign();
	signer.write(blob);
	cert.signatures.x509.signature = signer.sign();

	return (true);
}

function signAsync(cert, signer, done) {
	if (cert.signatures.x509 === undefined)
		cert.signatures.x509 = {};
	var sig = cert.signatures.x509;

	var der = new asn1.BerWriter();
	writeTBSCert(cert, der);
	var blob = der.buffer;
	sig.cache = blob;

	signer(blob, function (err, signature) {
		if (err) {
			done(err);
			return;
		}
		sig.algo = signature.type + '-' + signature.hashAlgorithm;
		if (SIGN_ALGS[sig.algo] === undefined) {
			done(new Error('Invalid signing algorithm "' +
			    sig.algo + '"'));
			return;
		}
		sig.signature = signature;
		done();
	});
}

function write(cert, options) {
	var sig = cert.signatures.x509;
	assert.object(sig, 'x509 signature');

	var der = new asn1.BerWriter();
	der.startSequence();
	if (sig.cache) {
		der._ensure(sig.cache.length);
		sig.cache.copy(der._buf, der._offset);
		der._offset += sig.cache.length;
	} else {
		writeTBSCert(cert, der);
	}

	der.startSequence();
	der.writeOID(SIGN_ALGS[sig.algo]);
	if (sig.algo.match(/^rsa-/))
		der.writeNull();
	der.endSequence();

	var sigData = sig.signature.toBuffer('asn1');
	var data = Buffer.alloc(sigData.length + 1);
	data[0] = 0;
	sigData.copy(data, 1);
	der.writeBuffer(data, asn1.Ber.BitString);
	der.endSequence();

	return (der.buffer);
}

function writeTBSCert(cert, der) {
	var sig = cert.signatures.x509;
	assert.object(sig, 'x509 signature');

	der.startSequence();

	der.startSequence(Local(0));
	der.writeInt(2);
	der.endSequence();

	der.writeBuffer(utils.mpNormalize(cert.serial), asn1.Ber.Integer);

	der.startSequence();
	der.writeOID(SIGN_ALGS[sig.algo]);
	if (sig.algo.match(/^rsa-/))
		der.writeNull();
	der.endSequence();

	cert.issuer.toAsn1(der);

	der.startSequence();
	writeDate(der, cert.validFrom);
	writeDate(der, cert.validUntil);
	der.endSequence();

	var subject = cert.subjects[0];
	var altNames = cert.subjects.slice(1);
	subject.toAsn1(der);

	pkcs8.writePkcs8(der, cert.subjectKey);

	if (sig.extras && sig.extras.issuerUniqueID) {
		der.writeBuffer(sig.extras.issuerUniqueID, Local(1));
	}

	if (sig.extras && sig.extras.subjectUniqueID) {
		der.writeBuffer(sig.extras.subjectUniqueID, Local(2));
	}

	if (altNames.length > 0 || subject.type === 'host' ||
	    (cert.purposes !== undefined && cert.purposes.length > 0) ||
	    (sig.extras && sig.extras.exts)) {
		der.startSequence(Local(3));
		der.startSequence();

		var exts = [];
		if (cert.purposes !== undefined && cert.purposes.length > 0) {
			exts.push({
				oid: EXTS.basicConstraints,
				critical: true
			});
			exts.push({
				oid: EXTS.keyUsage,
				critical: true
			});
			exts.push({
				oid: EXTS.extKeyUsage,
				critical: true
			});
		}
		exts.push({ oid: EXTS.altName });
		if (sig.extras && sig.extras.exts)
			exts = sig.extras.exts;

		for (var i = 0; i < exts.length; ++i) {
			der.startSequence();
			der.writeOID(exts[i].oid);

			if (exts[i].critical !== undefined)
				der.writeBoolean(exts[i].critical);

			if (exts[i].oid === EXTS.altName) {
				der.startSequence(asn1.Ber.OctetString);
				der.startSequence();
				if (subject.type === 'host') {
					der.writeString(subject.hostname,
					    Context(2));
				}
				for (var j = 0; j < altNames.length; ++j) {
					if (altNames[j].type === 'host') {
						der.writeString(
						    altNames[j].hostname,
						    ALTNAME.DNSName);
					} else if (altNames[j].type ===
					    'email') {
						der.writeString(
						    altNames[j].email,
						    ALTNAME.RFC822Name);
					} else {
						/*
						 * Encode anything else as a
						 * DN style name for now.
						 */
						der.startSequence(
						    ALTNAME.DirectoryName);
						altNames[j].toAsn1(der);
						der.endSequence();
					}
				}
				der.endSequence();
				der.endSequence();
			} else if (exts[i].oid === EXTS.basicConstraints) {
				der.startSequence(asn1.Ber.OctetString);
				der.startSequence();
				var ca = (cert.purposes.indexOf('ca') !== -1);
				var pathLen = exts[i].pathLen;
				der.writeBoolean(ca);
				if (pathLen !== undefined)
					der.writeInt(pathLen);
				der.endSequence();
				der.endSequence();
			} else if (exts[i].oid === EXTS.extKeyUsage) {
				der.startSequence(asn1.Ber.OctetString);
				der.startSequence();
				cert.purposes.forEach(function (purpose) {
					if (purpose === 'ca')
						return;
					if (KEYUSEBITS.indexOf(purpose) !== -1)
						return;
					var oid = purpose;
					if (EXTPURPOSE[purpose] !== undefined)
						oid = EXTPURPOSE[purpose];
					der.writeOID(oid);
				});
				der.endSequence();
				der.endSequence();
			} else if (exts[i].oid === EXTS.keyUsage) {
				der.startSequence(asn1.Ber.OctetString);
				/*
				 * If we parsed this certificate from a byte
				 * stream (i.e. we didn't generate it in sshpk)
				 * then we'll have a ".bits" property on the
				 * ext with the original raw byte contents.
				 *
				 * If we have this, use it here instead of
				 * regenerating it. This guarantees we output
				 * the same data we parsed, so signatures still
				 * validate.
				 */
				if (exts[i].bits !== undefined) {
					der.writeBuffer(exts[i].bits,
					    asn1.Ber.BitString);
				} else {
					var bits = writeBitField(cert.purposes,
					    KEYUSEBITS);
					der.writeBuffer(bits,
					    asn1.Ber.BitString);
				}
				der.endSequence();
			} else {
				der.writeBuffer(exts[i].data,
				    asn1.Ber.OctetString);
			}

			der.endSequence();
		}

		der.endSequence();
		der.endSequence();
	}

	der.endSequence();
}

/*
 * Reads an ASN.1 BER bitfield out of the Buffer produced by doing
 * `BerReader#readString(asn1.Ber.BitString)`. That function gives us the raw
 * contents of the BitString tag, which is a count of unused bits followed by
 * the bits as a right-padded byte string.
 *
 * `bits` is the Buffer, `bitIndex` should contain an array of string names
 * for the bits in the string, ordered starting with bit #0 in the ASN.1 spec.
 *
 * Returns an array of Strings, the names of the bits that were set to 1.
 */
function readBitField(bits, bitIndex) {
	var bitLen = 8 * (bits.length - 1) - bits[0];
	var setBits = {};
	for (var i = 0; i < bitLen; ++i) {
		var byteN = 1 + Math.floor(i / 8);
		var bit = 7 - (i % 8);
		var mask = 1 << bit;
		var bitVal = ((bits[byteN] & mask) !== 0);
		var name = bitIndex[i];
		if (bitVal && typeof (name) === 'string') {
			setBits[name] = true;
		}
	}
	return (Object.keys(setBits));
}

/*
 * `setBits` is an array of strings, containing the names for each bit that
 * sould be set to 1. `bitIndex` is same as in `readBitField()`.
 *
 * Returns a Buffer, ready to be written out with `BerWriter#writeString()`.
 */
function writeBitField(setBits, bitIndex) {
	var bitLen = bitIndex.length;
	var blen = Math.ceil(bitLen / 8);
	var unused = blen * 8 - bitLen;
	var bits = Buffer.alloc(1 + blen); // zero-filled
	bits[0] = unused;
	for (var i = 0; i < bitLen; ++i) {
		var byteN = 1 + Math.floor(i / 8);
		var bit = 7 - (i % 8);
		var mask = 1 << bit;
		var name = bitIndex[i];
		if (name === undefined)
			continue;
		var bitVal = (setBits.indexOf(name) !== -1);
		if (bitVal) {
			bits[byteN] |= mask;
		}
	}
	return (bits);
}


/***/ }),
/* 60 */,
/* 61 */
/***/ (function(module, __unusedexports, __webpack_require__) {

// Copyright 2018 Joyent, Inc.

module.exports = {
	read: read,
	write: write
};

var assert = __webpack_require__(522);
var Buffer = __webpack_require__(585).Buffer;
var rfc4253 = __webpack_require__(848);
var Key = __webpack_require__(344);

var errors = __webpack_require__(771);

function read(buf, options) {
	var lines = buf.toString('ascii').split(/[\r\n]+/);
	var found = false;
	var parts;
	var si = 0;
	while (si < lines.length) {
		parts = splitHeader(lines[si++]);
		if (parts &&
		    parts[0].toLowerCase() === 'putty-user-key-file-2') {
			found = true;
			break;
		}
	}
	if (!found) {
		throw (new Error('No PuTTY format first line found'));
	}
	var alg = parts[1];

	parts = splitHeader(lines[si++]);
	assert.equal(parts[0].toLowerCase(), 'encryption');

	parts = splitHeader(lines[si++]);
	assert.equal(parts[0].toLowerCase(), 'comment');
	var comment = parts[1];

	parts = splitHeader(lines[si++]);
	assert.equal(parts[0].toLowerCase(), 'public-lines');
	var publicLines = parseInt(parts[1], 10);
	if (!isFinite(publicLines) || publicLines < 0 ||
	    publicLines > lines.length) {
		throw (new Error('Invalid public-lines count'));
	}

	var publicBuf = Buffer.from(
	    lines.slice(si, si + publicLines).join(''), 'base64');
	var keyType = rfc4253.algToKeyType(alg);
	var key = rfc4253.read(publicBuf);
	if (key.type !== keyType) {
		throw (new Error('Outer key algorithm mismatch'));
	}
	key.comment = comment;
	return (key);
}

function splitHeader(line) {
	var idx = line.indexOf(':');
	if (idx === -1)
		return (null);
	var header = line.slice(0, idx);
	++idx;
	while (line[idx] === ' ')
		++idx;
	var rest = line.slice(idx);
	return ([header, rest]);
}

function write(key, options) {
	assert.object(key);
	if (!Key.isKey(key))
		throw (new Error('Must be a public key'));

	var alg = rfc4253.keyTypeToAlg(key);
	var buf = rfc4253.write(key);
	var comment = key.comment || '';

	var b64 = buf.toString('base64');
	var lines = wrap(b64, 64);

	lines.unshift('Public-Lines: ' + lines.length);
	lines.unshift('Comment: ' + comment);
	lines.unshift('Encryption: none');
	lines.unshift('PuTTY-User-Key-File-2: ' + alg);

	return (Buffer.from(lines.join('\n') + '\n'));
}

function wrap(txt, len) {
	var lines = [];
	var pos = 0;
	while (pos < txt.length) {
		lines.push(txt.slice(pos, pos + 64));
		pos += 64;
	}
	return (lines);
}


/***/ }),
/* 62 */,
/* 63 */,
/* 64 */,
/* 65 */
/***/ (function(module) {

"use strict";

module.exports = function generate_propertyNames(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  out += 'var ' + ($errs) + ' = errors;';
  if ((it.opts.strictKeywords ? typeof $schema == 'object' && Object.keys($schema).length > 0 : it.util.schemaHasRules($schema, it.RULES.all))) {
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    var $key = 'key' + $lvl,
      $idx = 'idx' + $lvl,
      $i = 'i' + $lvl,
      $invalidName = '\' + ' + $key + ' + \'',
      $dataNxt = $it.dataLevel = it.dataLevel + 1,
      $nextData = 'data' + $dataNxt,
      $dataProperties = 'dataProperties' + $lvl,
      $ownProperties = it.opts.ownProperties,
      $currentBaseId = it.baseId;
    if ($ownProperties) {
      out += ' var ' + ($dataProperties) + ' = undefined; ';
    }
    if ($ownProperties) {
      out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
    } else {
      out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
    }
    out += ' var startErrs' + ($lvl) + ' = errors; ';
    var $passData = $key;
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    var $code = it.validate($it);
    $it.baseId = $currentBaseId;
    if (it.util.varOccurences($code, $nextData) < 2) {
      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
    } else {
      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
    }
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' if (!' + ($nextValid) + ') { for (var ' + ($i) + '=startErrs' + ($lvl) + '; ' + ($i) + '<errors; ' + ($i) + '++) { vErrors[' + ($i) + '].propertyName = ' + ($key) + '; }   var err =   '; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('propertyNames') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { propertyName: \'' + ($invalidName) + '\' } ';
      if (it.opts.messages !== false) {
        out += ' , message: \'property name \\\'' + ($invalidName) + '\\\' is invalid\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError(vErrors); ';
      } else {
        out += ' validate.errors = vErrors; return false; ';
      }
    }
    if ($breakOnError) {
      out += ' break; ';
    }
    out += ' } }';
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  out = it.util.cleanUpCode(out);
  return out;
}


/***/ }),
/* 66 */,
/* 67 */
/***/ (function(module, __unusedexports, __webpack_require__) {

/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * MIT Licensed
 */

/**
 * Module exports.
 */

module.exports = __webpack_require__(270)


/***/ }),
/* 68 */,
/* 69 */,
/* 70 */,
/* 71 */,
/* 72 */
/***/ (function(module, __unusedexports, __webpack_require__) {

// Copyright 2017 Joyent, Inc.

module.exports = {
	DiffieHellman: DiffieHellman,
	generateECDSA: generateECDSA,
	generateED25519: generateED25519
};

var assert = __webpack_require__(522);
var crypto = __webpack_require__(417);
var Buffer = __webpack_require__(585).Buffer;
var algs = __webpack_require__(626);
var utils = __webpack_require__(541);
var nacl = __webpack_require__(115);

var Key = __webpack_require__(344);
var PrivateKey = __webpack_require__(149);

var CRYPTO_HAVE_ECDH = (crypto.createECDH !== undefined);

var ecdh = __webpack_require__(810);
var ec = __webpack_require__(325);
var jsbn = __webpack_require__(308).BigInteger;

function DiffieHellman(key) {
	utils.assertCompatible(key, Key, [1, 4], 'key');
	this._isPriv = PrivateKey.isPrivateKey(key, [1, 3]);
	this._algo = key.type;
	this._curve = key.curve;
	this._key = key;
	if (key.type === 'dsa') {
		if (!CRYPTO_HAVE_ECDH) {
			throw (new Error('Due to bugs in the node 0.10 ' +
			    'crypto API, node 0.12.x or later is required ' +
			    'to use DH'));
		}
		this._dh = crypto.createDiffieHellman(
		    key.part.p.data, undefined,
		    key.part.g.data, undefined);
		this._p = key.part.p;
		this._g = key.part.g;
		if (this._isPriv)
			this._dh.setPrivateKey(key.part.x.data);
		this._dh.setPublicKey(key.part.y.data);

	} else if (key.type === 'ecdsa') {
		if (!CRYPTO_HAVE_ECDH) {
			this._ecParams = new X9ECParameters(this._curve);

			if (this._isPriv) {
				this._priv = new ECPrivate(
				    this._ecParams, key.part.d.data);
			}
			return;
		}

		var curve = {
			'nistp256': 'prime256v1',
			'nistp384': 'secp384r1',
			'nistp521': 'secp521r1'
		}[key.curve];
		this._dh = crypto.createECDH(curve);
		if (typeof (this._dh) !== 'object' ||
		    typeof (this._dh.setPrivateKey) !== 'function') {
			CRYPTO_HAVE_ECDH = false;
			DiffieHellman.call(this, key);
			return;
		}
		if (this._isPriv)
			this._dh.setPrivateKey(key.part.d.data);
		this._dh.setPublicKey(key.part.Q.data);

	} else if (key.type === 'curve25519') {
		if (this._isPriv) {
			utils.assertCompatible(key, PrivateKey, [1, 5], 'key');
			this._priv = key.part.k.data;
		}

	} else {
		throw (new Error('DH not supported for ' + key.type + ' keys'));
	}
}

DiffieHellman.prototype.getPublicKey = function () {
	if (this._isPriv)
		return (this._key.toPublic());
	return (this._key);
};

DiffieHellman.prototype.getPrivateKey = function () {
	if (this._isPriv)
		return (this._key);
	else
		return (undefined);
};
DiffieHellman.prototype.getKey = DiffieHellman.prototype.getPrivateKey;

DiffieHellman.prototype._keyCheck = function (pk, isPub) {
	assert.object(pk, 'key');
	if (!isPub)
		utils.assertCompatible(pk, PrivateKey, [1, 3], 'key');
	utils.assertCompatible(pk, Key, [1, 4], 'key');

	if (pk.type !== this._algo) {
		throw (new Error('A ' + pk.type + ' key cannot be used in ' +
		    this._algo + ' Diffie-Hellman'));
	}

	if (pk.curve !== this._curve) {
		throw (new Error('A key from the ' + pk.curve + ' curve ' +
		    'cannot be used with a ' + this._curve +
		    ' Diffie-Hellman'));
	}

	if (pk.type === 'dsa') {
		assert.deepEqual(pk.part.p, this._p,
		    'DSA key prime does not match');
		assert.deepEqual(pk.part.g, this._g,
		    'DSA key generator does not match');
	}
};

DiffieHellman.prototype.setKey = function (pk) {
	this._keyCheck(pk);

	if (pk.type === 'dsa') {
		this._dh.setPrivateKey(pk.part.x.data);
		this._dh.setPublicKey(pk.part.y.data);

	} else if (pk.type === 'ecdsa') {
		if (CRYPTO_HAVE_ECDH) {
			this._dh.setPrivateKey(pk.part.d.data);
			this._dh.setPublicKey(pk.part.Q.data);
		} else {
			this._priv = new ECPrivate(
			    this._ecParams, pk.part.d.data);
		}

	} else if (pk.type === 'curve25519') {
		var k = pk.part.k;
		if (!pk.part.k)
			k = pk.part.r;
		this._priv = k.data;
		if (this._priv[0] === 0x00)
			this._priv = this._priv.slice(1);
		this._priv = this._priv.slice(0, 32);
	}
	this._key = pk;
	this._isPriv = true;
};
DiffieHellman.prototype.setPrivateKey = DiffieHellman.prototype.setKey;

DiffieHellman.prototype.computeSecret = function (otherpk) {
	this._keyCheck(otherpk, true);
	if (!this._isPriv)
		throw (new Error('DH exchange has not been initialized with ' +
		    'a private key yet'));

	var pub;
	if (this._algo === 'dsa') {
		return (this._dh.computeSecret(
		    otherpk.part.y.data));

	} else if (this._algo === 'ecdsa') {
		if (CRYPTO_HAVE_ECDH) {
			return (this._dh.computeSecret(
			    otherpk.part.Q.data));
		} else {
			pub = new ECPublic(
			    this._ecParams, otherpk.part.Q.data);
			return (this._priv.deriveSharedSecret(pub));
		}

	} else if (this._algo === 'curve25519') {
		pub = otherpk.part.A.data;
		while (pub[0] === 0x00 && pub.length > 32)
			pub = pub.slice(1);
		var priv = this._priv;
		assert.strictEqual(pub.length, 32);
		assert.strictEqual(priv.length, 32);

		var secret = nacl.box.before(new Uint8Array(pub),
		    new Uint8Array(priv));

		return (Buffer.from(secret));
	}

	throw (new Error('Invalid algorithm: ' + this._algo));
};

DiffieHellman.prototype.generateKey = function () {
	var parts = [];
	var priv, pub;
	if (this._algo === 'dsa') {
		this._dh.generateKeys();

		parts.push({name: 'p', data: this._p.data});
		parts.push({name: 'q', data: this._key.part.q.data});
		parts.push({name: 'g', data: this._g.data});
		parts.push({name: 'y', data: this._dh.getPublicKey()});
		parts.push({name: 'x', data: this._dh.getPrivateKey()});
		this._key = new PrivateKey({
			type: 'dsa',
			parts: parts
		});
		this._isPriv = true;
		return (this._key);

	} else if (this._algo === 'ecdsa') {
		if (CRYPTO_HAVE_ECDH) {
			this._dh.generateKeys();

			parts.push({name: 'curve',
			    data: Buffer.from(this._curve)});
			parts.push({name: 'Q', data: this._dh.getPublicKey()});
			parts.push({name: 'd', data: this._dh.getPrivateKey()});
			this._key = new PrivateKey({
				type: 'ecdsa',
				curve: this._curve,
				parts: parts
			});
			this._isPriv = true;
			return (this._key);

		} else {
			var n = this._ecParams.getN();
			var r = new jsbn(crypto.randomBytes(n.bitLength()));
			var n1 = n.subtract(jsbn.ONE);
			priv = r.mod(n1).add(jsbn.ONE);
			pub = this._ecParams.getG().multiply(priv);

			priv = Buffer.from(priv.toByteArray());
			pub = Buffer.from(this._ecParams.getCurve().
			    encodePointHex(pub), 'hex');

			this._priv = new ECPrivate(this._ecParams, priv);

			parts.push({name: 'curve',
			    data: Buffer.from(this._curve)});
			parts.push({name: 'Q', data: pub});
			parts.push({name: 'd', data: priv});

			this._key = new PrivateKey({
				type: 'ecdsa',
				curve: this._curve,
				parts: parts
			});
			this._isPriv = true;
			return (this._key);
		}

	} else if (this._algo === 'curve25519') {
		var pair = nacl.box.keyPair();
		priv = Buffer.from(pair.secretKey);
		pub = Buffer.from(pair.publicKey);
		priv = Buffer.concat([priv, pub]);
		assert.strictEqual(priv.length, 64);
		assert.strictEqual(pub.length, 32);

		parts.push({name: 'A', data: pub});
		parts.push({name: 'k', data: priv});
		this._key = new PrivateKey({
			type: 'curve25519',
			parts: parts
		});
		this._isPriv = true;
		return (this._key);
	}

	throw (new Error('Invalid algorithm: ' + this._algo));
};
DiffieHellman.prototype.generateKeys = DiffieHellman.prototype.generateKey;

/* These are helpers for using ecc-jsbn (for node 0.10 compatibility). */

function X9ECParameters(name) {
	var params = algs.curves[name];
	assert.object(params);

	var p = new jsbn(params.p);
	var a = new jsbn(params.a);
	var b = new jsbn(params.b);
	var n = new jsbn(params.n);
	var h = jsbn.ONE;
	var curve = new ec.ECCurveFp(p, a, b);
	var G = curve.decodePointHex(params.G.toString('hex'));

	this.curve = curve;
	this.g = G;
	this.n = n;
	this.h = h;
}
X9ECParameters.prototype.getCurve = function () { return (this.curve); };
X9ECParameters.prototype.getG = function () { return (this.g); };
X9ECParameters.prototype.getN = function () { return (this.n); };
X9ECParameters.prototype.getH = function () { return (this.h); };

function ECPublic(params, buffer) {
	this._params = params;
	if (buffer[0] === 0x00)
		buffer = buffer.slice(1);
	this._pub = params.getCurve().decodePointHex(buffer.toString('hex'));
}

function ECPrivate(params, buffer) {
	this._params = params;
	this._priv = new jsbn(utils.mpNormalize(buffer));
}
ECPrivate.prototype.deriveSharedSecret = function (pubKey) {
	assert.ok(pubKey instanceof ECPublic);
	var S = pubKey._pub.multiply(this._priv);
	return (Buffer.from(S.getX().toBigInteger().toByteArray()));
};

function generateED25519() {
	var pair = nacl.sign.keyPair();
	var priv = Buffer.from(pair.secretKey);
	var pub = Buffer.from(pair.publicKey);
	assert.strictEqual(priv.length, 64);
	assert.strictEqual(pub.length, 32);

	var parts = [];
	parts.push({name: 'A', data: pub});
	parts.push({name: 'k', data: priv.slice(0, 32)});
	var key = new PrivateKey({
		type: 'ed25519',
		parts: parts
	});
	return (key);
}

/* Generates a new ECDSA private key on a given curve. */
function generateECDSA(curve) {
	var parts = [];
	var key;

	if (CRYPTO_HAVE_ECDH) {
		/*
		 * Node crypto doesn't expose key generation directly, but the
		 * ECDH instances can generate keys. It turns out this just
		 * calls into the OpenSSL generic key generator, and we can
		 * read its output happily without doing an actual DH. So we
		 * use that here.
		 */
		var osCurve = {
			'nistp256': 'prime256v1',
			'nistp384': 'secp384r1',
			'nistp521': 'secp521r1'
		}[curve];

		var dh = crypto.createECDH(osCurve);
		dh.generateKeys();

		parts.push({name: 'curve',
		    data: Buffer.from(curve)});
		parts.push({name: 'Q', data: dh.getPublicKey()});
		parts.push({name: 'd', data: dh.getPrivateKey()});

		key = new PrivateKey({
			type: 'ecdsa',
			curve: curve,
			parts: parts
		});
		return (key);
	} else {

		var ecParams = new X9ECParameters(curve);

		/* This algorithm taken from FIPS PUB 186-4 (section B.4.1) */
		var n = ecParams.getN();
		/*
		 * The crypto.randomBytes() function can only give us whole
		 * bytes, so taking a nod from X9.62, we round up.
		 */
		var cByteLen = Math.ceil((n.bitLength() + 64) / 8);
		var c = new jsbn(crypto.randomBytes(cByteLen));

		var n1 = n.subtract(jsbn.ONE);
		var priv = c.mod(n1).add(jsbn.ONE);
		var pub = ecParams.getG().multiply(priv);

		priv = Buffer.from(priv.toByteArray());
		pub = Buffer.from(ecParams.getCurve().
		    encodePointHex(pub), 'hex');

		parts.push({name: 'curve', data: Buffer.from(curve)});
		parts.push({name: 'Q', data: pub});
		parts.push({name: 'd', data: priv});

		key = new PrivateKey({
			type: 'ecdsa',
			curve: curve,
			parts: parts
		});
		return (key);
	}
}
]);
// Element.closest
(function(ELEMENT) {
  ELEMENT.matches = ELEMENT.matches || ELEMENT.mozMatchesSelector || ELEMENT.msMatchesSelector || ELEMENT.oMatchesSelector || ELEMENT.webkitMatchesSelector;
  ELEMENT.closest = ELEMENT.closest || function closest(selector) {
      if (!this) return null;
      if (this.matches(selector)) return this;
      if (!this.parentElement) {return null}
      else return this.parentElement.closest(selector)
    };
}(Element.prototype));

// String.repeat
// if (!String.prototype.repeat) {
//   String.prototype.repeat = function(count) {
//     'use strict';
//     if (this == null) {
//       throw new TypeError('can\'t convert ' + this + ' to object');
//     }
//     var str = '' + this;
//     count = +count;
//     if (count !== count) {
//       count = 0;
//     }
//     if (count < 0) {
//       throw new RangeError('repeat count must be non-negative');
//     }
//     if (count === Infinity) {
//       throw new RangeError('repeat count must be less than infinity');
//     }
//     count = Math.floor(count);
//     if (str.length === 0 || count === 0) {
//       return '';
//     }
//     // Обеспечение того, что count является 31-битным целым числом, позволяет нам значительно
//     // соптимизировать главную часть функции. Впрочем, большинство современных (на август
//     // 2014 года) браузеров не обрабатывают строки, длиннее 1 << 28 символов, так что:
//     if (str.length * count >= 1 << 28) {
//       throw new RangeError('repeat count must not overflow maximum string size');
//     }
//     var rpt = '';
//     for (var i = 0; i < count; i++) {
//       rpt += str;
//     }
//     return rpt;
//   }
// }

// Object.assign
// if (!Object.assign) {
//   Object.defineProperty(Object, 'assign', {
//     enumerable: false,
//     configurable: true,
//     writable: true,
//     value: function(target, firstSource) {
//       if (target === undefined || target === null) {
//         throw new TypeError('Cannot convert first argument to object');
//       }
//
//       var to = Object(target);
//       for (var i = 1; i < arguments.length; i++) {
//         var nextSource = arguments[i];
//         if (nextSource === undefined || nextSource === null) {
//           continue;
//         }
//
//         var keysArray = Object.keys(Object(nextSource));
//         for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
//           var nextKey = keysArray[nextIndex];
//           var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
//           if (desc !== undefined && desc.enumerable) {
//             to[nextKey] = nextSource[nextKey];
//           }
//         }
//       }
//       return to;
//     }
//   });
// }

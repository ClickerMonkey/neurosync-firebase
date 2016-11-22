// UMD (Universal Module Definition)
(function (root, factory)
{
  if (typeof define === 'function' && define.amd) // jshint ignore:line
  {
    // AMD. Register as an anonymous module.
    define(['rekord', 'firebase'], function(Rekord, firebase) { // jshint ignore:line
      return factory(root, Rekord, firebase);
    });
  }
  else if (typeof module === 'object' && module.exports)  // jshint ignore:line
  {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(global, require('rekord'), require('firebase'));  // jshint ignore:line
  }
  else
  {
    // Browser globals (root is window)
    root.Rekord = factory(root, root.Rekord, root.Firebase || root.firebase);
  }
}(this, function(global, Rekord, firebase, undefined)
{

  var isObject = Rekord.isObject;
  var isFunction = Rekord.isFunction;
  var isArray = Rekord.isArray;
  var isString = Rekord.isString;
  var noop = Rekord.noop;

  var Rekord_live = Rekord.live;
  var Rekord_rest = Rekord.rest;

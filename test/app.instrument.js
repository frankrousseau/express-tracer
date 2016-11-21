var assert = require('assert');
var express = require('express');
var expressTrace = require('../index.js');


describe('app', function(){
  describe('.instrument(fn)', function(){
    it('should add function to the tracer list', function(){
      var app = express();
      expressTrace(app);
      function debug (options) {
        return options.event;
      }
      app.instrument(debug);
      assert.equal(debug, app.tracers[0]);
    });

    it('should throw err if tracer is not a function', function(){
      var app = express();

      assert.throws(function(){
        app.instrument('notatracer');
      }, Error);
    });
  })
})

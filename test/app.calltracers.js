var assert = require('assert')
var express = require('express');
var expressTrace = require('../index.js');



describe('app', function(){
  describe('.callTracers(options)', function(){
    it('should activate all tracers', function(){
      var app = express();
      expressTrace(app);
      app.id = 'app-1';
      var log = '';

      function tracer(options){
        assert.equal(options.app, app);
        assert.equal(options.req.url, '/');
        assert.equal(options.res.id, '1');
        assert.equal(options.event, 'new:event');
        assert(options.date !== undefined);
        assert.equal(options.args[0], 'arg1');
      }

      function otherTracer(options){
        log = options.event;
      }

      app.instrument(tracer);
      app.instrument(otherTracer);

      var res = Object.create(app.response);
      res.req = Object.create(app.request);
      res.req.url = '/';
      res.id = '1';
      app.callTracers(res, 'new:event', ['arg1']);

      assert.equal(log, 'new:event');
    });
  })
})

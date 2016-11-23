# express-tracer

Express-tracer allows you to follow and inspect the behaviour of your
controllers through the response object. It provides helpers to instrument your
Express application with tracers.  Via a `trace` method on the response
object, you can activate them each time you want to record something.

Extension:

*  [DTrace with chrome tracing](https://github.com/No9/dtrace-express)


Build status: [![Build Status](https://travis-ci.org/frankrousseau/express-tracer.png?branch=master)](https://travis-ci.org/frankrousseau/express-tracer)

## Usage 

First, add the dependency to your project:

```bash
npm install express-tracer
```

Then add tracing helpers to express by running this module on your express app.
Once done, you can configure your tracers at the application level. Now, each
time you want to trace something, call the `trace` function on the response
object.


```javascript
var express = require('express')
var expressTrace = require('express-tracer')
var debug = require('debug')('trace:response')

var app = express()
expressTrace(app)

app.instrument(function (options){
  debug(options.date + ' ' + options.event)
})

app.get('/', function (req, res){
  res.trace('index:hello')
  res.send('hello world')
})
```


## Contributing

To discuss anything on this project, open an [issue](https://github.com/frankrousseau/express-tracer/issues).

Of course, any code contribution is welcome! To propose your patch make a pull
request on the master branch and make sure the Travis tests succeed. If you
can't manage to make the tests green, don't worry we'll figure out a way to
merge your changes!

### Contributor list

* Frank Rousseau


## Documentation

### API

#### app.instrument(tracer)

Add a tracer to the application object. This tracer will be activated each time
the `trace` method of a response is called.

A tracer is a function which takes an options object as argument containing 
the following fields:

* `res`: Response that fired the tracing.
* `req`: Request related to the response that fired the tracing.
* `app`: Application object.
* `event`: String sent by the response to name the event.
* `date`: Date when the tracing occured.
* `args`: Additional arguments provided by the tracing call.

For example:

```js
app.instrument(function(options){
  debug(options.event + ' ' + options.date + ' ' + options.argv[0]);
});
```

#### res.trace(event, [parameters])

Fire all tracers instrumented at the application level.

Optional parameters:

- `event`, name of the event to send to tracers.
- `parameters`, additional parameters to send to tracers.

```js
app.get('/', function(req, res){
  res.trace('index:visited', 'my-parameter');
  res.render('index');
});
```


### Use cases


### Example 1: Time interval

In some cases you, may want to capture time spent on a specific request. Here
is a way to do it through tracing.

```js
var express = require('express');
var expressTracer = require('express-tracer');
var debug = require('debug')('trace:response');

var app = express();
var responseTime = {};

expressTracer(app);

app.instrument(function (options){
  if (options.event === 'duration:start') {
    responseTime[options.res.id] = options.date;
  } else if (options.event === 'duration:end') {
    var interval = options.date - responseTime[options.res.id];
    debug(options.req.path + ' - ' + interval + 'ms');
    delete responseTime[options.res.id];
  }
})

app.use(function(req, res, next){
  res.id = Math.floor(Math.random() * 1000000);
  res.trace('duration:start');
  next();
});

app.get('/', function (req, res){
  res.trace('index:hello');
  res.send('hello world');
  res.trace('duration:end');
})

app.listen(3000);
```

### Example 2: Send information to dtrace.

Dtrace is a common tool for tracing. It generates probes that will listen and
report any event targeted to it. You can simply reach the probe via the trace
function.

```js
var express = require('express');
var expressTracer = require('express-tracer');
var dtrace = require('dtrace-provider');

var app = express();
expressTracer(app);

var dtp = dtrace.createDTraceProvider("nodeapp");
var p1 = dtp.addProbe("probe1", "char *", "char *");
var p2 = dtp.addProbe("probe2", "char *", "char *");
dtp.enable();

app.instrument(function (options){
  dtp.fire("probe1", function(){
    return [options.event, options.date];
  });
  dtp.fire("probe2", function(){
    return [options.event, options.args[0]];
  });
});

app.get('/', function (req, res){
  res.trace('index:hello');
  res.send('hello world');
})

app.listen(3000);
```

### Example 3: Send information to chrome tracer.

You may want to use the chrome tracer to analyze some response behaviour.

```js
var express = require('./index');
var expressTracer = require('express-tracer');

var app = express();
expressTracer(app);

var events = [];

app.instrument(function (options){
  if (options.event === 'start') {
    events.push({
      "name": options.args[0],
      "cat": "PERF",
      "ph": "B",
      "pid": process.pid,
      "ts": options.date.getTime()
    });
  } else if (options.event === 'end') {
    events.push({
      "name": options.args[0],
      "cat": "PERF",
      "ph": "E",
      "pid": process.pid,
      "ts": options.date.getTime()
    });
  }
})

app.get('/', function (req, res, next){
  res.trace('start', 'index');
  setTimeout(function () {
    res.send('hello world');
    res.trace('end');
  }, Math.random() * 100);
})

process.on('SIGINT', function (){
  require('fs').writeFileSync('./myfile', JSON.stringify(events));
  process.exit(0);
})

app.listen(3000);
```

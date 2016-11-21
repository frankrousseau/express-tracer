/*
 * Set a tracer at the application level. Tracer will be activated when a
 * tracing call will be fired by a response.
 * The tracer function takes an option object as argument with the given
 * attributes:
 *
 * - app: current application
 * - res: response that fires the tracer
 * - req: request related to above response
 * - event: string describing the event to trace
 * - date: when the tracing occurs
 * - args: allow to freely add information
 *
 * @param {function} The tracer to set.
 * @return {app} for chaining.
 */

function instrument (tracer){
  if (tracer === undefined || typeof tracer !== 'function')
    throw new TypeError('instrument expects a function');
  this.tracers.push(tracer);
  return this;
};


/*
 * Call all tracers set on the application. Add context information:
 * running app, request, response and date. The date is the when the tracing
 * was fired (now).
 *
 * @param {Response} Response that fires the tracing event.
 * @param {Event} The event to trace.
 * @param {Array} Arguments to transmit to the tracker.
 */

function callTracers(res, event, args){
  var date = new Date();
  var app = this;
  var tracers = this.tracers;
  var length = tracers.length;

  var options = {
    app: app,
    res: res,
    req: res.req,
    event: event,
    date: date,
    args: args
  };

  for (var i = 0; i < length; i++) {
    tracers[i](options);
  }
};


/**
 * Run every tracers set at the application level for given events
 * and arguments. To set a tracer on the application use the `instrument`
 * method.
 *
 * @param {function} event The event to trace.
 * @return {ServerResponse} for chaining
 */

function trace(event) {
  var args;
  switch (arguments.length) {
    case 0:
      throw new Error('No event defined!');
    case 1:
      args = [];
      break;
    case 2:
      args = [arguments[1]];
      break;
    default:
      args = [].slice.call(arguments, 1);
  }
  this.app.callTracers(this, event, args);
  return this;
};


module.exports = function configureExpressApp (app) {
  app.tracers = [];
  app.instrument = instrument;
  app.callTracers = callTracers;
  app.response.__proto__.trace = trace;
  app.on('mount', function onAppMounted(parent) {
    app.instrument(function callParentTracer(options) {
      parent.callTracers(options.res, options.event, options.args);
    });
  });
}

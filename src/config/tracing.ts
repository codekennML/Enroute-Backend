import  { BaselimeSDK } from '@baselime/node-opentelemetry'
import  { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import opentelemetry from '@opentelemetry/api';

const sdk = new BaselimeSDK({
  instrumentations: [
    getNodeAutoInstrumentations(),
  ],
});

sdk.start();

// Get tracer
const tracer = opentelemetry.trace.getTracer('example-basic-tracer-node');

//Create a span
const parentSpan = tracer.startSpan('main');
parentSpan.end();

// Create meter
const meter = opentelemetry.metrics.getMeter(
  'instrumentation-scope-name',
  'instrumentation-scope-version',
);

// Create a counter
const counter = meter.createCounter('my-counter');
counter.add(1);

// Create a gauge
const gauge = meter.createUpDownCounter('events.counter');
counter.add(1);
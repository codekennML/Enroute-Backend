import winston from "winston";
import path from "node:path";
import fs from "node:fs";
import { BaselimeTransport } from '@baselime/winston-transport';

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import logsAPI from '@opentelemetry/api-logs'
import  {
    LoggerProvider,
    SimpleLogRecordProcessor,
    ConsoleLogRecordExporter,
} from '@opentelemetry/sdk-logs'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'
import  { registerInstrumentations } from '@opentelemetry/instrumentation'

const tracerProvider = new NodeTracerProvider();
tracerProvider.register();

// To start a logger, you first need to initialize the Logger provider.
const loggerProvider = new LoggerProvider();
// Add a processor to export log record
loggerProvider.addLogRecordProcessor(
    new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
);

//@ts0expect-error ts cannot recognize this 
//logsAPI.logs.setGlobalLoggerProvider(loggerProvider)

registerInstrumentations({
    instrumentations: [
        new WinstonInstrumentation({
        }),
    ],
});




const BASELIME_API_KEY =  process.env.BASELIME_KEY as string

//Create zip archive
// async function createZipArchive(logFiles, zipFilePath) {
//   const output = fs.createWriteStream(zipFilePath);
//   const archive = archiver("zip", { zlib: { level: 9 } });

//   return new Promise((resolve, reject) => {
//     output.on("close", resolve);
//     archive.on("error", reject);

//     archive.pipe(output);
//     logFiles.forEach((file) => {
//       const filename = path.basename(file);
//       archive.file(file, { name: filename });
//     });

//     archive.finalize();
//   });
// }

// upload log to cloud service
// async function uploadLogFilesToCloudService() {
//   const currentDate = new Date();
//   const datePattern = currentDate.toISOString().slice(0, 10); // Format: YYYY-MM-DD

//   const logFiles = fs.readdirSync(logs).filter((file) => {
//     return file.includes(datePattern);
//   });

//   const zipFilePath = path.join(logs, `${datePattern}.zip`);

//   await createZipArchive(
//     logFiles.map((file) => path.join(logs, file)),
//     zipFilePath
//   );
//   // await uploadToCloudService(zipFilePath);
//   fs.unlinkSync(zipFilePath);
// }

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),

  winston.format.printf(info => {

    const { timestamp, level, message, trace_id, span_id, trace_flags, duration,requestId, method, url, ipAddress } = info;

    return JSON.stringify({
      timestamp,
      level,
      message,
      traceId : trace_id,
      namespace : url,
      method,
      duration,
      requestId,
      span_id,
      trace_flags,
      ipAddress
    });
  })
)

const logs = path.join(__dirname, "logs");
if (!fs.existsSync(logs)) {
  fs.mkdirSync(logs);
}

export const accessLogger = winston.createLogger({
  level: "http",
  format,
  transports: [
    // new DailyRotateFile({
    //   filename: path.join(logs, "error-%DATE%.log"),
    //   datePattern: "YYYY-MM-DD",
    //   zippedArchive: true,
    //   maxSize: "20m",
    //   maxFiles: "10d",
    // }),
    new BaselimeTransport({
      baselimeApiKey: BASELIME_API_KEY,
      dataset : "accessLogs", 
      service : "access",
      namespace : "node-route"
  }),
    new winston.transports.Console(),
  ],
});

export const authLogger = winston.createLogger({
  level: "info",
  format,
  transports: [
    new winston.transports.Console(),
    new BaselimeTransport({
      baselimeApiKey: BASELIME_API_KEY,
      dataset : "authenticationLogs", 
      service : "auth",
      namespace : "node-route"
 })

  ],
});

export const requestLogger =  winston.createLogger({
  level: "http",
  format,
  transports: [new winston.transports.Console(),
    new BaselimeTransport({
      baselimeApiKey: BASELIME_API_KEY,
      dataset : "requestLogs", 
      service : "requests",
      namespace : "node-route"
  })
  ],
});

export const errorLogger = winston.createLogger({
  level: "error",
  format,
  transports: [new winston.transports.Console(),
    new BaselimeTransport({
      baselimeApiKey: BASELIME_API_KEY, 
      dataset : "errorLogs", 
      service : "errors",
      namespace : "node-route"
  })
  ],
});

export const webhooksLogger = winston.createLogger({
  level: "info",
  format,
  transports: [new winston.transports.Console(),
    new BaselimeTransport({
      baselimeApiKey: BASELIME_API_KEY, 
      dataset : "webhookLogs", 
      service : "webhooks",
      namespace : "node-route"
  })
  ],
});

export const cronEventsLogger = winston.createLogger({
  level: "info",
  format,
  transports: [new winston.transports.Console(),
    new BaselimeTransport({
      baselimeApiKey: BASELIME_API_KEY,
      dataset : "cronLogs", 
      service : "crons",
      namespace : "node-route"
  })
  ],
});

export const notificationsLogger = winston.createLogger({
  level: "info",
  format,
  transports: [new winston.transports.Console()],
});

export const QueueLogger = winston.createLogger({
  level: "error",
  format,
  transports: [new winston.transports.Console(),
    new BaselimeTransport({
      baselimeApiKey: BASELIME_API_KEY,
      dataset : "queueLogs", 
      service : "queues",
      namespace : "node-route"
  })
  ],
});




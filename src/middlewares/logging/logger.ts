import winston from "winston";
import path from "node:path";
import fs from "node:fs";

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

//upload log to cloud service
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
  // winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} ~ ${info.level.toUpperCase()} ~  ${info.message}`
  )
);

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
    new winston.transports.Console(),
  ],
});

export const authLogger = winston.createLogger({
  level: "http",
  format,
  transports: [new winston.transports.Console()],
});

export const criticalLogger = winston.createLogger({
  level: "http",
  format,
  transports: [new winston.transports.Console()],
});

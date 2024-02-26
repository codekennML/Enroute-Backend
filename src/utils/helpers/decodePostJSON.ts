import { HttpRequest, HttpResponse } from "uWebsockets.js";
import { tryCatch } from "../helpers/tryCatch";

const MAX_BODY_SIZE = 2 ** 20; // 1MB

const responseHandler =
  (basefn: () => Promise<{ status: number; data: object }>) =>
  async (res: HttpResponse, req: HttpRequest) => {
    res.onAborted(() => {
      res.aborted = true;
    });

    let tokens;

    if (!res.aborted) {
      res.cork(async () => {
        const response = await (await tryCatch(basefn))(res, req);

        const { status, ...data } = response;

        tokens = {
          accessToken: req.getHeader(process.env.ACCESS_TOKEN_ID as string),
          refreshToken: req.getHeader(process.env.REFRESH_TOKEN_ID as string),
        };

        const newData = { ...data, ...(tokens && { tokens: { ...tokens } }) };

        res.writeStatus(JSON.stringify(status)).end(JSON.stringify(newData));
      });
    } else {
      res
        .writeStatus("429")
        .end("Invalid request data. Please check your inputs and try again");
    }
  };

// export function readJSON(res: HttpResponse): T {
//   let buffer: Buffer;

//   res.onData((dataChunk: ArrayBuffer, isLast: boolean) => {
//     const chunk = Buffer.from(dataChunk);

//     if (isLast) {
//       let json! : T;
//       if (buffer) {
//         try {
//           const concatenatedBuffer = Buffer.concat([buffer, chunk]);
//           if (concatenatedBuffer.length > MAX_BODY_SIZE) {
//             throw new Error("Payload too large");
//           }
//           const jsonString = concatenatedBuffer.toString("utf-8");
//           json = JSON.parse(jsonString);
//         } catch (e) {
//           res.close();
//           // Log or handle the error
//           console.error("Error parsing JSON:", e);
//         }
//         return json;
//       } else {
//         try {
//           if (chunk.length > MAX_BODY_SIZE) {
//             throw new Error("Payload too large");
//           }
//           json = JSON.parse(chunk.toString("utf-8"));
//         } catch (e) {
//           res.close();
//           // Log or handle the error
//           console.error("Error parsing JSON:", e);
//         }
//         return json;
//       }
//     } else {
//       if (buffer) {
//         buffer = Buffer.concat([buffer, chunk]);
//       } else {
//         buffer = Buffer.concat([chunk]);
//       }
//     }
//   });
// }

export function readJSON<T>(res: HttpResponse): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const buffer: Buffer[] = [];

    res.onData((dataChunk: ArrayBuffer, isLast: boolean) => {
      const chunk = Buffer.from(dataChunk);

      if (isLast) {
        try {
          if (buffer.length > 0) {
            buffer.push(chunk);
            const concatenatedBuffer = Buffer.concat(buffer);
            if (concatenatedBuffer.length > MAX_BODY_SIZE) {
              throw new Error("Payload too large");
            }
            const jsonString = concatenatedBuffer.toString("utf-8");
            const json = JSON.parse(jsonString);
            resolve(json);
          } else {
            if (chunk.length > MAX_BODY_SIZE) {
              throw new Error("Payload too large");
            }
            const json = JSON.parse(chunk.toString("utf-8"));
            resolve(json);
          }
        } catch (e) {
          // Log or handle the error
          console.error("Error parsing JSON:", e);
          reject(e);
        } finally {
          res.close();
        }
      } else {
        buffer.push(chunk);
      }
    });
  });
}

module.exports = { responseHandler };

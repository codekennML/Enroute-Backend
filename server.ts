import "dotenv/config" 
import express, { Application } from "express";
import { startDB } from "../route/src/config/connectDB";
const app: Application = express();

import path from "node:path";
// import cookieParser from "cookie-parser";
import { logEvents } from "./src/middlewares/errors/logger";
import errorHandler from "./src/middlewares/errors/errorHandler";
import cors from "cors";
import corsOptions from "./src/config/cors/corsOptions";
import mongoose from "mongoose";
import closeWithGrace from "close-with-grace";
import rideRouter from "./src/routes/ride"
import bodyParser from "body-parser";
import { serverAdapter } from "./src/services/bullmq/ui";
import { otpLimiter, apiLimiter } from "./src/utils/helpers/rateLimit";
import multer from "multer"
import * as z from "zod"
import { fork} from "node:child_process"
import AppResponse from "./src/utils/helpers/AppResponse";
import { StatusCodes } from "http-status-codes";
import { errorLogger } from "./src/middlewares/logging/logger";
import { tryCatch } from "./src/middlewares/errors/tryCatch";
import validateRequest from "./src/middlewares/validation/base";

import axios from "axios";
//@ts-expect-error No types for this module
import {  xss }  from "express-xss-sanitizer"
import helmet from "helmet"
import authRouter from "./src/routes/auth";
import otpRouter from "./src/routes/otp";
import tripRouter from "./src/routes/trips";
import morganMiddleware from "./src/middlewares/logging/morgan";
import rtracer  from "cls-rtracer"
import userRouter from "./src/routes/user";
import tripScheduleRouter from "./src/routes/tripSchedule"
import documentRouter from "./src/routes/documents"
import rideRequestRouter from "./src/routes/rideRequest"
import packageScheduleRouter from "./src/routes/packageSchedule"
import packageScheduleRequestRouter from "./src/routes/packageScheduleRequest"
import ratingRouter from "./src/routes/ratings"
import sosRouter from "./src/routes/sos"
import settlementRouter from "./src/routes/settlements"
import countryRouter from "./src/routes/country"
import townRouter from "./src/routes/town"
import stateRouter from "./src/routes/state"
import vehicleRouter from "./src/routes/vehicle"
import busStationRouter from "./src/routes/busStation"
import AuthGuard from "./src/middlewares/auth/verifyTokens";
import { verifyPermissions } from "./src/middlewares/auth/permissionGuard";
import { ROLES } from "./src/config/enums";
import { ticketsSchema} from "./src/routes/schemas/tickets"

const upload = multer({ 
  dest : "uploads/"
})

const PORT = process.env.PORT ?? 3500;

//Connect to MongoDB
startDB();


app.use(morganMiddleware)

app.use(cors(corsOptions));

app.use(helmet())
// app.use(cookieParser());

app.use(rtracer.expressMiddleware());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.json());

app.use(xss())


app.get("/api/health",(req, res) =>{
  res.status(200).json({ message : "All good"})
})


app.use('/api/otp', otpLimiter , otpRouter)

app.use("/admin/queueviewer/ui", AuthGuard, verifyPermissions([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DEV]), serverAdapter.getRouter());


app.use(apiLimiter)

app.use('/api/auth', authRouter)

app.use("/api/ride", rideRouter)
app.use('/api/trip_schedule', tripScheduleRouter)
app.use("/api/trip", tripRouter)
app.use("/api/user", userRouter )
app.use("/api/documents/", documentRouter)
app.use("/api/package_schedule/", packageScheduleRouter)
app.use("/api/package_schedule_request/", packageScheduleRequestRouter)
app.use("/api/ride_request/", rideRequestRouter)
app.use("/api/state/", stateRouter)
app.use("/api/country/", countryRouter)
app.use("/api/town/", townRouter)
app.use("/api/sos/", sosRouter)
app.use("/api/upload/", upload.single('image'),  validateRequest(z.object({ name: z.string() })),
tryCatch( async (req, res) => {

  if(!req?.file) return AppResponse(req, res, StatusCodes.BAD_REQUEST, { message : "Please add at least one file"})
  // const schema =  z.safeParse()

  if (req?.file?.size > 5 * 1024 * 1024) return AppResponse(req, res, StatusCodes.BAD_REQUEST, { message: "File too large" })

  const worker = fork(path.join(__dirname, "src", "utils", "lib", "imageProcessor.ts"))

   worker.send({
    type : "upload", 
    filePath : req.file.path, 
    bucketName : req.body.name,
    userId : req.user, 
    fileOriginalName : req.file.originalname
   })

   //Worker respomse 

   worker.on("message", (message : {success: boolean , uri ? : string}) => { 

    if(message.success){ 
      return AppResponse(req, res, StatusCodes.OK, { message : "Image upload successful",  data : {uri : message.uri}})
    } else {
      return AppResponse(req, res, StatusCodes.INTERNAL_SERVER_ERROR, {
        message : "An error occurred while uploading this image. Please try again", 
      })
    }
   })

   worker.on('error', (err) => {
    errorLogger.error(`Image upload worker process error - ${err}`)
     return AppResponse(req, res, StatusCodes.INTERNAL_SERVER_ERROR, {
       message: "An error occurred while uploading this image. Please try again",
     })

   })

  worker.on('exit', (code : number) => {
    if(code !== 0 ){

      errorLogger.error(`Image upload worker process exited with code  - ${code}`)
    }
    return AppResponse(req, res, StatusCodes.INTERNAL_SERVER_ERROR, {
      message: "An error occurred while uploading this image. Please try again",
    })
  })
})

)
app.use("/api/ratings/", ratingRouter)
app.use("/api/settlements/", settlementRouter)
app.use("/api/bus_station/", busStationRouter)
app.use("/api/vehicle", vehicleRouter)

//This is handled by seventy-seven.dev
app.use("/api/tickets", validateRequest(ticketsSchema), AuthGuard,
  tryCatch(async(req, res)=>{

const createdTicketResponse  =  await axios.post<{id : string}>("https://app.seventy-seven.dev//api/tickets", {
     
        subject : `${req.body.title}-${req.user}`, 
        body : req.body.body, 
        senderAvatarUrl : req.body.sendAvatarUrl, 
        senderFullName : req.body.senderFullName, 
        senderEmail : req.body.senderEmail
        
      } , { 
        headers : { 
          "Content-Type" : "application/json",
          Authorization :`Bearer ${process.env.TICKETS_GATEWAY_TOKEN as string}`
        }
      })
     
      
  if(createdTicketResponse?.status !== 200 ){

        if(createdTicketResponse?.status  ===  408){
          
        errorLogger.error(`Tickets Gateway creation timeout -  ${createdTicketResponse.statusText} - user - ${req.user}`)
        
        } else { 

        errorLogger.error(`Tickets Gateway Error -  ${createdTicketResponse.statusText} - user - ${req.user} - error - ${createdTicketResponse.statusText}`)

        }
        return AppResponse(req, res, StatusCodes.REQUEST_TIMEOUT, { message: "We are unable to complete this request.Please try again later" })

      }

      return AppResponse(req, res, StatusCodes.CREATED, { message : "Your ticket has been created.",
        data : {
          id : createdTicketResponse.data.id
        }
      })
    })
)

app.all("*", (req, res) => {
  res.status(404).json({
    message: "404 Not Found. No matching resource",
  });

});


mongoose.connection.once("open", async () => {
  console.log("Connecting to MongoDB");
});

mongoose.connection.on("error", (err) => {
  logEvents(
    `${err.no} : ${err.code}\t${err.syscall}\t${err.hostname} `,
    "mongoErrLog.log"
  );
});

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

process.on("uncaughtException", (error : Error) => { 
  console.log(`Unhandled Rejection: ${error}`)
  logEvents(`${error.name}: ${error.message}\t${error.stack}`, "uncaughtExceptions.log")
  process.exit(1)
})

process.on("unhandledRejection", (error : Error) => {
  logEvents(`${error.name}: ${error.message}\t${error.stack}`, "unhandledRejections.log")
  process.exit(1)
})

app.use(errorHandler);


closeWithGrace(
  {
    delay: 500,
    logger: {
      error: async (m) =>
        await logEvents(`[close-with-grace] ${m}`, "serverCloseLogs.log"),
    },
  },
  async function ({ signal, err, manual }) {
    if (err) {
      console.error(signal, err, manual);
    }
   
  }
);



import { getReasonPhrase, StatusCodes } from "http-status-codes";
import AppError from "../errors/BaseError";

import { setAccessToken, } from "./setTokens";
import  { UserServiceLayer } from "../../services/userService";
import { OtpServiceLayer } from "../../services/otpService";
import { checkUserCanAuthenticate } from "../../utils/helpers/canLogin";
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response} from "express"
import { ROLES } from "../../config/enums";

interface DecodedToken extends JwtPayload {
  user: string;  // Adjust the type based on your actual payload
  role: number;  // Adjust the type based on your actual payload
  mobileId?: string; // This field is optional based on your conditional checks
  subRole : number
}


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
const driver_app_id =  process.env.DRIVER_APP_ID as string
const rider_app_id =  process.env.RIDER_APP_ID as string


const AuthGuard = 

 async (req: Request, res: Response, next: NextFunction) => {

  const mobileId = req.headers["mobile-device-id"] as string |  undefined
  const app_id  =  req.headers["app_id"]


  const accessToken = req.headers["x_a_t"] as string
  const refreshToken  =  req.headers["x_r_t"] as string


  try {

  
  if (!accessToken || !refreshToken)
    throw new AppError(
      getReasonPhrase(StatusCodes.UNAUTHORIZED),
      StatusCodes.UNAUTHORIZED
    );

    console.log("here", app_id,  rider_app_id, driver_app_id)

  await jwt.verify(accessToken, ACCESS_TOKEN_SECRET, async(err,  decoded)=> {
   console.log(decoded, err)
    if (err) {
    console.log("Missi", err)
        await refreshUserToken(
              req,
              res,
              refreshToken,
              mobileId
            );

        return  next()

          }
  

      //If the device does not match the device this token was created for ,or this accessToken was created for a mobile device and is being used via another platform

const {mobileId  : userMobileId, user,  role, subRole } =  decoded as DecodedToken

if (mobileId &&  mobileId !== userMobileId) 
  {


    throw new AppError(
      getReasonPhrase(StatusCodes.UNAUTHORIZED),
      StatusCodes.UNAUTHORIZED
    );
  }
 console.log(app_id, app_id===driver_app_id, role)

  if(app_id === rider_app_id && role !== ROLES.RIDER) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)

  if(app_id === driver_app_id && role !== ROLES.DRIVER) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)

    if(!app_id && role in [ROLES.DRIVER, ROLES.RIDER])throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED) 
 
req.user = user
req.role = role
req.subRole =  subRole
   next();
})
}catch(err){
  next(err)
}

}

const refreshUserToken = async (
  req: Request ,
  res: Response,
  refreshToken: string,
  mobileId?: string,
) => {

  await jwt.verify(refreshToken,REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err)
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED
      );
      
    console.log(decoded)
    const { user,role }  = decoded as DecodedToken

    const app_id = req.headers["app_id"]
    
    console.log(app_id === rider_app_id, role, user) 

    if(app_id === rider_app_id && role !== ROLES.RIDER) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)

    if(app_id === driver_app_id && role !== ROLES.DRIVER) throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED)
     
    if(!app_id && role in [ROLES.DRIVER, ROLES.RIDER])throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED) 

    const hashedRefreshToken = OtpServiceLayer.hashOTP(refreshToken);

    const docToUpdate : Record<string , string> = {
      refreshToken: hashedRefreshToken,
      _id: user,
    } 

    if(mobileId) docToUpdate["mobileAuthId"] = mobileId

  
    const userWithRefreshToken = await UserServiceLayer.updateUser({
       docToUpdate, 
       updateData : {
        accessTokenExpiresAt: new Date(Date.now() + 16 * 60 * 1000)
      },
      options :{ 
        new : true, 
        select: "suspended active banned roles subRole",
      }

    });

    if (!userWithRefreshToken)
      throw new AppError(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED
      );
 
    checkUserCanAuthenticate(userWithRefreshToken);
console.log("Viaa")
   await setAccessToken(req, res, user, userWithRefreshToken.roles, userWithRefreshToken?.subRole)

  });
};

export default AuthGuard;

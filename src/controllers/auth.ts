import { OtpServiceLayer } from './../services/otpService';
import { StatusCodes } from "http-status-codes";
import UserService from "../services/userService";

import { Notification } from "../services/mailService";
import AuthService from '../services/authService';


class Auth { 
     
    protected authService: AuthService;

  constructor(auth: AuthService) {
    this.authService = auth;
  }









  async validateEmailOtp(){ 
     
    const { otpId, otp } =  data 

    const otpInfo  =  await OtpServiceLayer.verifyOTPs({ otpId, otp}, session ) 
  }
 
  if()

 }


    async signInUserSocial() { 

    }



}
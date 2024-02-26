import passport from "passport";
import { app } from "../app";
import { HttpRequest, HttpResponse } from "uWebsockets.js";
import { authService } from "../services/authService";

interface SocialLoginUser extends HttpRequest {
  mobileVerified?: boolean;
  _id?: string;
  clientDevice?: string;
  clientIp?: string;
}

type AuthHttpRequestType = SocialLoginUser;

// const domain = DOMAINURL.BASEURL_USER as string;
const canProceedInAuth = async (
  user: Pick<
    SocialLoginUser,
    "mobileVerified" | "_id" | "clientDevice" | "clientIp"
  >,
  req: AuthHttpRequestType,
  res: HttpResponse
) => {
  if (!user.mobileVerified) {
    //Redirect to main signup
    res.writeStatus("302").writeHeader("Location", "/login").end();
  } else {
    //Redirect to home

    //Call auth service here to give and record the users refresh token
    const userData = await authService.authenticateUser({
      user: user._id ?? "",
      shouldVerify: false,

      clientDevice: user.clientDevice ?? "",
      clientIp: user.clientIp ?? "",
      userDeviceIdentifier: user.clientDevice ?? "",
    });
    //Send them  a refresh token
    res
      .writeStatus("302")
      .writeHeader("Location", "/home")
      .writeHeader("Authorization", `Bearer ${userData.refreshToken}`)
      .end();
  }
};

app
  .get("/healthCheck", async (res, req) => {
    console.log(req);

    res.end("All good");
  })
  .get(
    "/auth/google/callback",
    async (res: HttpResponse, req: AuthHttpRequestType) => {
      await passport.authenticate("google", { failureRedirect: "/login" });

      const user = {
        mobileVerified: req.mobileVerified,
        userId: req._id,
      };

      canProceedInAuth(user, req, res);
    }
  )
  .get(
    "/auth/facebook/callback",
    (res: HttpResponse, req: AuthHttpRequestType) => {
      passport.authenticate("facebook", { failureRedirect: "/login" });

      const user = {
        mobileVerified: req?.mobileVerified,
        userId: req?._id,
      };

      canProceedInAuth(user, req, res);
    }
  );

//   .post(`${domain}/auth/signup`);
//   .post(`${domain}/auth/login`);
//   .post(`${domain}/auth/activate_acccount`);
//   .post(`${domain}/auth/forgot_password`);
//   .put(`${domain}/auth/reset_password`);

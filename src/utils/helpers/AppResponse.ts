import { HttpResponse } from "uWebsockets.js";
import { HttpRequest } from "uWebsockets.js";

const AppResponse = <T>(
  res: HttpResponse,
  req: HttpRequest,
  status: number,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: T
) => {
  res.cork(() => {
    res.writeHeader("MOBILE_ACCESS_ID", "145366477474");
  });
  // const tokens = {
  //   accessToken: req.getHeader(process.env.ACCESS_TOKEN_ID as string),
  //   refreshToken: req.getHeader(process.env.REFRESH_TOKEN_ID as string),
  // };

  const response = {
    status,
    data,
    // ...(tokens && { tokens: { ...tokens } }),
  };

  return response;
};

export default AppResponse;

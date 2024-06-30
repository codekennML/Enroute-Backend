import { Request, Response } from "express";

const AppResponse = <T>(
  req: Request,
  res: Response,
  status: number,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: T
) => {
  // res.cork(() => {
  //   res.writeHeader("MOBILE_ACCESS_ID", "145366477474");
  // });

  const tokens = {
    accessToken: req.headers[process.env.ACCESS_TOKEN_ID as string],
    refreshToken: req.headers[process.env.REFRESH_TOKEN_ID as string],
  };

  if (Array.isArray(data)) {


    let transformedData = []

    if (data[0] && data[0]["password"]) {

      transformedData = data.map(data => data.delete["password"])
    }

    const response = {
      transformedData,
      ...(tokens && { tokens: { ...tokens } }),
    };

    res.status(status).json(response);
  }

  if (typeof data === "object" && "password" in data!) {
    delete (data.password)
  }

  const response : Record<string, T | typeof tokens> = {
    data 
  };

  if(tokens?.accessToken){
      response["tokens"] =  tokens
  }

  res.status(status).json(response);

};

export default AppResponse;

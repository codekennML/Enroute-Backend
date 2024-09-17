// import { Request, Response } from "express";

// const AppResponse = <T>(
//   req: Request,
//   res: Response,
//   status: number,
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   data: T
// ) => {
//   // res.cork(() => {
//   //   res.writeHeader("MOBILE_ACCESS_ID", "145366477474");
//   // });

//   const tokens = {
//     accessToken: req.headers[process.env.ACCESS_TOKEN_ID as string],
//     refreshToken: req.headers[process.env.REFRESH_TOKEN_ID as string],
//   };

//   if (Array.isArray(data)) {


//     let transformedData = []

//     if (data[0] && data[0]["password"]) {

//       transformedData = data.map(data => data.delete["password"])
//     }

//     const response = {
//       transformedData,
//       ...(tokens && { tokens: { ...tokens } }),
//     };

//     res.status(status).json(response);
//   }

//   if (typeof data === "object" && "password" in data!) {
//     delete (data.password)
//   }

//   const response: Record<string, T | T extends typeof tokens> = {
//     ...data
//   };

//   console.log(response)

//   if (tokens?.accessToken) {
//     response["tokens"] = tokens
//   }

//   res.status(status).json(response);

// };

// export default AppResponse;



import { Request, Response } from "express";

type Tokens = {
  accessToken: string | undefined;
  refreshToken: string | undefined;
};

type DataWithPassword = {
  password?: string;
  [key: string]: any;
};

function AppResponse<T extends object>(
  req: Request,
  res: Response,
  status: number,
  data: T | DataWithPassword | (T | DataWithPassword)[]
): void {
  const tokens: Tokens = {
    accessToken: req.headers[process.env.ACCESS_TOKEN_ID as string] as string | undefined,
    refreshToken: req.headers[process.env.REFRESH_TOKEN_ID as string] as string | undefined,
  };

  if (Array.isArray(data)) {
    const transformedData = data.map(item => {
      if ('password' in item) {
        const { password, ...rest } = item;
        return rest;
      }
      return item;
    });

    const response = {
      ...transformedData,
      ...(tokens.accessToken && { tokens }),
    };

    res.status(status).json(response);
  } else {
    let responseData: Partial<T> | Omit<DataWithPassword, 'password'> = { ...data };

    if ('password' in responseData) {
      delete responseData.password;
    }

    const response: Record<string, any> = {
      ...responseData,
      ...(tokens.accessToken && { tokens }),
    };

    console.log(response);
    res.status(status).json(response);
  }
}

export default AppResponse;
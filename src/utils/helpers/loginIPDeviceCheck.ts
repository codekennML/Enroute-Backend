export function transformIP(clientIp: string): string {
  return JSON.stringify(clientIp.split(".").join(""));
}

export function getLatestDevice(userAgent: UserAgent): string {
  const deviceName = userAgent.device?.name || "Unknown Device";
  const osName = userAgent.os?.name || "Unknown OS";
  return `${deviceName} - ${osName}`;
}

// export function shouldAlertUser(
//   transformedIP: string,
//   latestDevice: string,
//   user?: Pick<IUserModel, "accessInfo">,
// ): boolean {
//   const userIPAddresses = user?.accessInfo

//   //If this is the first time user is logging in or if this is a previously known ip && device , dont alert.Alert  otherwise
//   if (
//     !userIPAddresses ||
//     (userIPAddresses &&
//       userIPAddresses[
//         `${transformedIP}-${latestDevice}` as keyof typeof userIPAddresses
//       ])
//   )
//     return false;

//   return true;
// }

// // ...

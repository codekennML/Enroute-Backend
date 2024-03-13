import { OAuth2Client } from "google-auth-library";
import { GOOGLE_WEB_CLIENT_ID } from "../../../config/constants/auth";
const client = new OAuth2Client();

const verifyGoogleToken = async (token: string) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: GOOGLE_WEB_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });

  const payload = ticket.getPayload();

  return payload;
};

export default verifyGoogleToken;

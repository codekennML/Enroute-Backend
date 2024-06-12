
import { Resend } from "resend";
import { RESEND_KEY } from "../../../config/constants/notification";


const resend = new Resend(RESEND_KEY)

export default resend 
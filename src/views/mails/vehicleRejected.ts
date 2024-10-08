import { COMPANY_NAME } from "../../config/constants/base";

export const VehicleRejectedMail = <T>(vehicleInfo : T) => {

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">

  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>

  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">You&#x27;re now ready to make live transactions with ${COMPANY_NAME} </div>

  <body style="background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif">
    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:37.5em;background-color:#ffffff;margin:0 auto;padding:20px 0 48px;margin-bottom:64px">
      <tbody>
        <tr style="width:100%">
          <td>
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="padding:0 48px">
              <tbody>
                <tr>
                  <td><img alt=${COMPANY_NAME}${vehicleInfo}height="21" src="https://react-email-demo-7qy8spwep-resend.vercel.app/static/stripe-logo.png" style="display:block;outline:none;border:none;text-decoration:none" width="49" />
                    <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#e6ebf1;margin:20px 0" />
                    <p style="font-size:16px;line-height:24px;margin:16px 0;color:#525f7f;text-align:left">Hello ,<br>
                   </p>
                    <p style="font-size:16px;line-height:24px;margin:16px 0;color:#525f7f;text-align:left">You can order rides, send packages and view your activity history as well as a variety of other information about your account right from the  ${COMPANY_NAME} app.</p><a href="https://${COMPANY_NAME}/login" style="line-height:100%;text-decoration:none;display:block;max-width:100%;background-color:#656ee8;border-radius:5px;color:#fff;font-size:16px;font-weight:bold;text-align:center;width:100%;padding:10px 10px 10px 10px" target="_blank"><span><!--[if mso]><i style="letter-spacing: 10px;mso-font-width:-100%;mso-text-raise:15" hidden>&nbsp;</i><![endif]--></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:7.5px">Go to ${COMPANY_NAME}</span><span><!--[if mso]><i style="letter-spacing: 10px;mso-font-width:-100%" hidden>&nbsp;</i><![endif]--></span></a>
                    <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#e6ebf1;margin:20px 0" />
                    <p style="font-size:16px;line-height:24px;margin:16px 0;color:#525f7f;text-align:left">If you haven&#x27;t finished your integration, you might find our<!-- --> <a href="https://stripe.com/docs" style="color:#556cd6;text-decoration:none" target="_blank">docs</a> <!-- -->handy.</p>
                    <p style="font-size:16px;line-height:24px;margin:16px 0;color:#525f7f;text-align:left">Once you&#x27;re ready to start accepting payments, you&#x27;ll just need to use your live<!-- --> <a href="https://dashboard.stripe.com/login?redirect=%2Fapikeys" style="color:#556cd6;text-decoration:none" target="_blank">API keys</a> <!-- -->instead of your test API keys. Your account can simultaneously be used for both test and live requests, so you can continue testing while accepting live payments. Check out our<!-- --> <a href="https://stripe.com/docs/dashboard" style="color:#556cd6;text-decoration:none" target="_blank">tutorial about account basics</a>.</p>
                    <p style="font-size:16px;line-height:24px;margin:16px 0;color:#525f7f;text-align:left">Finally, we&#x27;ve put together a<!-- --> <a href="https://stripe.com/docs/checklist/website" style="color:#556cd6;text-decoration:none" target="_blank">quick checklist</a> <!-- -->to ensure your website conforms to card network standards.</p>
                    <p style="font-size:16px;line-height:24px;margin:16px 0;color:#525f7f;text-align:left">We&#x27;ll be here to help you with any step along the way. You can find answers to most questions and get in touch with us on our<!-- --> <a href="https://support.stripe.com/" style="color:#556cd6;text-decoration:none" target="_blank">support site</a>.</p>
                    <p style="font-size:16px;line-height:24px;margin:16px 0;color:#525f7f;text-align:left">— The ${COMPANY_NAME} team</p>
                    <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#e6ebf1;margin:20px 0" />
                    <p style="font-size:12px;line-height:16px;margin:16px 0;color:#8898aa">Stripe, 354 Oyster Point Blvd, South San Francisco, CA 94080</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>

</html>`
};

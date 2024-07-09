import { COMPANY_NAME, COMPANY_ADDRESS } from "../../config/constants/base";

export const WelcomeMail = (firstname: string) => {

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="https://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
 <meta charset="UTF-8" />
 <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
 <!--[if !mso]><!-- -->
 <meta http-equiv="X-UA-Compatible" content="IE=edge" />
 <!--<![endif]-->
 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 <meta name="format-detection" content="telephone=no" />
 <meta name="format-detection" content="date=no" />
 <meta name="format-detection" content="address=no" />
 <meta name="format-detection" content="email=no" />
 <meta name="x-apple-disable-message-reformatting" />
 <link href="https://fonts.googleapis.com/css?family=Inter:ital,wght@0,400" rel="stylesheet" />
 <title>${COMPANY_NAME} welcome</title>

 <style>
 html,
         body {
             margin: 0 !important;
             padding: 0 !important;
             min-height: 100% !important;
             width: 100% !important;
             -webkit-font-smoothing: antialiased;
         }
 
         * {
             -ms-text-size-adjust: 100%;
         }
 
         #outlook a {
             padding: 0;
         }
 
         .ReadMsgBody,
         .ExternalClass {
             width: 100%;
         }
 
         .ExternalClass,
         .ExternalClass p,
         .ExternalClass td,
         .ExternalClass div,
         .ExternalClass span,
         .ExternalClass font {
             line-height: 100%;
         }
 
         table,
         td,
         th {
             mso-table-lspace: 0 !important;
             mso-table-rspace: 0 !important;
             border-collapse: collapse;
         }
 
         u + .body table, u + .body td, u + .body th {
             will-change: transform;
         }
 
         body, td, th, p, div, li, a, span {
             -webkit-text-size-adjust: 100%;
             -ms-text-size-adjust: 100%;
             mso-line-height-rule: exactly;
         }
 
         img {
             border: 0;
             outline: 0;
             line-height: 100%;
             text-decoration: none;
             -ms-interpolation-mode: bicubic;
         }
 
         a[x-apple-data-detectors] {
             color: inherit !important;
             text-decoration: none !important;
         }
 
         .pc-gmail-fix {
             display: none;
             display: none !important;
         }
 
         .body .pc-project-body {
             background-color: transparent !important;
         }
 
         @media (min-width: 621px) {
             .pc-lg-hide {
                 display: none;
             } 
 
             .pc-lg-bg-img-hide {
                 background-image: none !important;
             }
         }
 </style>
 <style>
 @media (max-width: 620px) {
 .pc-project-body {min-width: 0px !important;}
 .pc-project-container {width: 100% !important;}
 .pc-sm-hide {display: none !important;}
 .pc-sm-bg-img-hide {background-image: none !important;}
 .pc-w620-lineHeight-134pc {line-height: 134% !important;}
 .pc-w620-padding-10-35-10-35 {padding: 10px 35px 10px 35px !important;}
 .pc-w620-padding-10-30-10-30 {padding: 10px 30px 10px 30px !important;}
 .pc-w620-padding-35-35-35-35 {padding: 35px 35px 35px 35px !important;}
 
 .pc-w620-gridCollapsed-1 > tbody,.pc-w620-gridCollapsed-1 > tbody > tr,.pc-w620-gridCollapsed-1 > tr {display: inline-block !important;}
 .pc-w620-gridCollapsed-1.pc-width-fill > tbody,.pc-w620-gridCollapsed-1.pc-width-fill > tbody > tr,.pc-w620-gridCollapsed-1.pc-width-fill > tr {width: 100% !important;}
 .pc-w620-gridCollapsed-1.pc-w620-width-fill > tbody,.pc-w620-gridCollapsed-1.pc-w620-width-fill > tbody > tr,.pc-w620-gridCollapsed-1.pc-w620-width-fill > tr {width: 100% !important;}
 .pc-w620-gridCollapsed-1 > tbody > tr > td,.pc-w620-gridCollapsed-1 > tr > td {display: block !important;width: auto !important;padding-left: 0 !important;padding-right: 0 !important;}
 .pc-w620-gridCollapsed-1.pc-width-fill > tbody > tr > td,.pc-w620-gridCollapsed-1.pc-width-fill > tr > td {width: 100% !important;}
 .pc-w620-gridCollapsed-1.pc-w620-width-fill > tbody > tr > td,.pc-w620-gridCollapsed-1.pc-w620-width-fill > tr > td {width: 100% !important;}
 .pc-w620-gridCollapsed-1 > tbody > .pc-grid-tr-first > .pc-grid-td-first,pc-w620-gridCollapsed-1 > .pc-grid-tr-first > .pc-grid-td-first {padding-top: 0 !important;}
 .pc-w620-gridCollapsed-1 > tbody > .pc-grid-tr-last > .pc-grid-td-last,pc-w620-gridCollapsed-1 > .pc-grid-tr-last > .pc-grid-td-last {padding-bottom: 0 !important;}
 
 .pc-w620-gridCollapsed-0 > tbody > .pc-grid-tr-first > td,.pc-w620-gridCollapsed-0 > .pc-grid-tr-first > td {padding-top: 0 !important;}
 .pc-w620-gridCollapsed-0 > tbody > .pc-grid-tr-last > td,.pc-w620-gridCollapsed-0 > .pc-grid-tr-last > td {padding-bottom: 0 !important;}
 .pc-w620-gridCollapsed-0 > tbody > tr > .pc-grid-td-first,.pc-w620-gridCollapsed-0 > tr > .pc-grid-td-first {padding-left: 0 !important;}
 .pc-w620-gridCollapsed-0 > tbody > tr > .pc-grid-td-last,.pc-w620-gridCollapsed-0 > tr > .pc-grid-td-last {padding-right: 0 !important;}
 
 .pc-w620-tableCollapsed-1 > tbody,.pc-w620-tableCollapsed-1 > tbody > tr,.pc-w620-tableCollapsed-1 > tr {display: block !important;}
 .pc-w620-tableCollapsed-1.pc-width-fill > tbody,.pc-w620-tableCollapsed-1.pc-width-fill > tbody > tr,.pc-w620-tableCollapsed-1.pc-width-fill > tr {width: 100% !important;}
 .pc-w620-tableCollapsed-1.pc-w620-width-fill > tbody,.pc-w620-tableCollapsed-1.pc-w620-width-fill > tbody > tr,.pc-w620-tableCollapsed-1.pc-w620-width-fill > tr {width: 100% !important;}
 .pc-w620-tableCollapsed-1 > tbody > tr > td,.pc-w620-tableCollapsed-1 > tr > td {display: block !important;width: auto !important;}
 .pc-w620-tableCollapsed-1.pc-width-fill > tbody > tr > td,.pc-w620-tableCollapsed-1.pc-width-fill > tr > td {width: 100% !important;box-sizing: border-box !important;}
 .pc-w620-tableCollapsed-1.pc-w620-width-fill > tbody > tr > td,.pc-w620-tableCollapsed-1.pc-w620-width-fill > tr > td {width: 100% !important;box-sizing: border-box !important;}
 }
 @media (max-width: 520px) {
 .pc-w520-padding-10-30-10-30 {padding: 10px 30px 10px 30px !important;}
 .pc-w520-padding-10-25-10-25 {padding: 10px 25px 10px 25px !important;}
 .pc-w520-padding-30-30-30-30 {padding: 30px 30px 30px 30px !important;}
 }
 </style>
 <!--[if mso]>
    <style type="text/css">
        .pc-font-alt {
            font-family: Comic Sans MS, Textile, Cursive, sans-serif !important;
        }
    </style>
    <![endif]-->
 <!--[if gte mso 9]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
</head>

<body class="body pc-font-alt" style="width: 100% !important; min-height: 100% !important; margin: 0 !important; padding: 0 !important; line-height: 1.5; color: #2D3A41; mso-line-height-rule: exactly; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-variant-ligatures: normal; text-rendering: optimizeLegibility; -moz-osx-font-smoothing: grayscale; background-color: #f4f4f4;" bgcolor="#f4f4f4">
 <table class="pc-project-body" style="table-layout: fixed; min-width: 600px; background-color: #f4f4f4;" bgcolor="#f4f4f4" width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
  <tr>
   <td align="center" valign="top">
    <table class="pc-project-container" style="width: 600px; max-width: 600px;" width="600" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
     <tr>
      <td style="padding: 20px 0px 20px 0px;" align="left" valign="top">
       <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="width: 100%;">
        <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Text -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td style="padding: 0px 0px 0px 0px;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w520-padding-10-30-10-30 pc-w620-padding-10-35-10-35" style="padding: 10px 40px 10px 40px; border-radius: 0px; background-color: #ffffff;" bgcolor="#ffffff">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                 <tr>
                  <td valign="top" align="left">
                   <div class="pc-font-alt pc-w620-lineHeight-134pc" style="line-height: 140%; letter-spacing: -0.1px; font-family: 'Inter', Comic Sans MS, Textile, Cursive, sans-serif; font-size: 15px; font-weight: normal; font-variant-ligatures: normal; color: #4f4f4f; text-align: left; text-align-last: left;">
                    <div><span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px"></span>
                    </div>
                    <div><span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px"></span>
                    </div>
                    <div><span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px"></span>
                    </div>
                    <div><span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px">Hey ${firstname}</span>
                    </div>
                    <div><span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px"></span>
                    </div>
                    <div><span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px">Welcome to ${COMPANY_NAME}, where every ride is an adventure waiting to happen! We&#39;re thrilled to have you join us . Whether you&#39;re commuting to work, exploring new neighborhoods, or heading out for a night on the town, ${COMPANY_NAME} is here to make your movements effortless and enjoyable.</span>
                    </div>
                   </div>
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
          <!-- END MODULE: Text -->
         </td>
        </tr>
        <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Text -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td style="padding: 0px 0px 0px 0px;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w520-padding-10-30-10-30 pc-w620-padding-10-35-10-35" style="padding: 10px 40px 10px 40px; border-radius: 0px; background-color: #ffffff;" bgcolor="#ffffff">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                 <tr>
                  <td valign="top" align="left">
                   <div class="pc-font-alt" style="line-height: 140%; letter-spacing: -0.2px; font-family: 'Inter', Comic Sans MS, Textile, Cursive, sans-serif; font-size: 15px; font-weight: normal; font-variant-ligatures: normal; color: #333333; text-align: left; text-align-last: left;">
                    <div><span style="font-weight: 700;font-style: normal;">Before You Ride : </span>
                    </div>
                    <div><span>&#xFEFF;</span>
                    </div>
                    <div><span style="font-weight: 400;font-style: normal;">Help us keep ${COMPANY_NAME}  safe for you and other users by providing : </span>
                    </div>
                   
                    </div>
                    <ol style="margin: 0; padding: 0 0 0 20px; list-style: arabic;">
                     <li><span style="font-weight: 700;font-style: normal;">National Identification Number:</span><span> You will need to upload a copy of your ID (e.g., Driver&#39;s License, Passport) in order to ride</span>
                     </li>
                     <li><span style="font-weight: 700;font-style: normal;">Passport Photograph:</span><span> Add a clear photo to help fellow riders and drivers identify you.</span>
                     </li>
                     <li><span style="font-weight: 700;font-style: normal;">Selfie Verification:</span><span> Snap a quick selfie for added security and identity confirmation.</span>
                     </li>
                    </ol>
                   </div>
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
          <!-- END MODULE: Text -->
         </td>
        </tr>
        <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Text -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td style="padding: 0px 0px 0px 0px;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w520-padding-10-30-10-30 pc-w620-padding-10-35-10-35" style="padding: 10px 40px 10px 40px; border-radius: 0px; background-color: #ffffff;" bgcolor="#ffffff">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                 <tr>
                  <td valign="top" align="left">
                   <div class="pc-font-alt" style="line-height: 140%; letter-spacing: -0.2px; font-family: 'Inter', Comic Sans MS, Textile, Cursive, sans-serif; font-size: 15px; font-weight: normal; font-variant-ligatures: normal; color: #333333; text-align: left; text-align-last: left;">
                    <div><span style="color: rgb(79, 79, 79);">We understand the importance of your privacy and security. Rest assured, all information provided is kept confidential and for verification purposes only.</span>
                    </div>
                    <div><span style="color: rgb(79, 79, 79);">If you have any questions or need assistance at any step of the way, our support team is available to assist you. Feel free to reach out to us by using the support option on the mobile application. Your journey with ${COMPANY_NAME } is important to us, and we&#39;re here to ensure it&#39;s as seamless as possible.</span>
                    </div>
                   
                    <div><span style="color: rgb(63, 61, 61);">Looking forward to being a part of your journey</span>
                    </div>
                   </div>
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
          <!-- END MODULE: Text -->
         </td>
        </tr>
        <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Footer 7 -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td style="padding: 0px 0px 0px 0px;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w520-padding-30-30-30-30 pc-w620-padding-35-35-35-35" style="padding: 40px 40px 40px 40px; border-radius: 0px; background-color: #ffffff;" bgcolor="#ffffff">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td align="left" valign="top" style="padding: 0px 0px 14px 0px;">
                   <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                    <tr>
                     <td valign="top" align="left">
                      <div class="pc-font-alt" style="line-height: 143%; letter-spacing: -0.2px; font-family: 'Inter', Comic Sans MS, Textile, Cursive, sans-serif; font-size: 14px; font-weight: normal; font-variant-ligatures: normal; color: #9b9b9b; text-align: left; text-align-last: left;">
                       <div><span style="font-weight: 700;font-style: normal;color: rgb(73, 73, 73);">$copy;${new Date().getFullYear()} ${COMPANY_NAME},</span><span> </span>
                       </div>
                       <div><span style="font-size: 16px;">${COMPANY_ADDRESS}</span>
                       </div>
                      </div>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
          <!-- END MODULE: Footer 7 -->
         </td>
        </tr>
  //   
 </table>
 <!-- Fix for Gmail on iOS -->
 <div class="pc-gmail-fix" style="white-space: nowrap; font: 15px courier; line-height: 0;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
 </div>
</body>

</html>
`
};


//     <tr>
  //        <td>
  //         <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
  //          <tr>
  //           <td align="center" valign="top" style="padding-top: 20px; padding-bottom: 20px; vertical-align: top;">
  //            <a href="https://designmodo.com/postcards?uid=MjUyMTA2&type=footer" target="_blank" style="text-decoration: none; overflow: hidden; border-radius: 2px; display: inline-block;">
  //             <img src="https://cloudfilesdm.com/postcards/promo-footer-dark.jpg" width="198" height="46" alt="Made with (o -) postcards" style="width: 198px; height: auto; margin: 0 auto; border: 0; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; vertical-align: top;">
  //            </a>
  //            <img src="https://api-postcards.designmodo.com/tracking/mail/promo?uid=MjUyMTA2" width="1" height="1" alt="" style="display:none; width: 1px; height: 1px;">
  //           </td>
  //          </tr>
  //         </table>
  //        </td>
  //       </tr>
  //      </table>
  //     </td>
  //    </tr>
  //   </table>
  //  </td>
  // </tr>

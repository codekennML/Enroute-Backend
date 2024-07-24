import { COMPANY_ADDRESS, COMPANY_NAME } from "../../config/constants/base";

export const CommissionDebitSuccesssMail = (amount: number, date : Date, reference : string ) => {

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="https://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <meta name="format-detection" content="date=no">
    <meta name="format-detection" content="address=no">
    <meta name="format-detection" content="email=no">
    <meta name="x-apple-disable-message-reformatting">
    <link href="https://fonts.googleapis.com/css?family=Inter:ital,wght@0,400" rel="stylesheet">
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

        u+.body table,
        u+.body td,
        u+.body th {
            will-change: transform;
        }

        body,
        td,
        th,
        p,
        div,
        li,
        a,
        span {
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
            .pc-project-body {
                min-width: 0px !important;
            }

            .pc-project-container {
                width: 100% !important;
            }

            .pc-sm-hide {
                display: none !important;
            }

            .pc-sm-bg-img-hide {
                background-image: none !important;
            }

            .pc-w620-lineHeight-134pc {
                line-height: 134% !important;
            }

            .pc-w620-padding-10-35-10-35 {
                padding: 10px 35px 10px 35px !important;
            }

            .pc-w620-padding-10-30-10-30 {
                padding: 10px 30px 10px 30px !important;
            }

            .pc-w620-padding-35-35-35-35 {
                padding: 35px 35px 35px 35px !important;
            }

            .pc-w620-gridCollapsed-1 &gt;
            tbody,
            .pc-w620-gridCollapsed-1 &gt;
            tbody &gt;
            tr,
            .pc-w620-gridCollapsed-1 &gt;

            tr {
                display: inline-block !important;
            }

            .pc-w620-gridCollapsed-1.pc-width-fill &gt;
            tbody,
            .pc-w620-gridCollapsed-1.pc-width-fill &gt;
            tbody &gt;
            tr,
            .pc-w620-gridCollapsed-1.pc-width-fill &gt;

            tr {
                width: 100% !important;
            }

            .pc-w620-gridCollapsed-1.pc-w620-width-fill &gt;
            tbody,
            .pc-w620-gridCollapsed-1.pc-w620-width-fill &gt;
            tbody &gt;
            tr,
            .pc-w620-gridCollapsed-1.pc-w620-width-fill &gt;

            tr {
                width: 100% !important;
            }

            .pc-w620-gridCollapsed-1 &gt;
            tbody &gt;
            tr &gt;
            td,
            .pc-w620-gridCollapsed-1 &gt;
            tr &gt;

            td {
                display: block !important;
                width: auto !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            .pc-w620-gridCollapsed-1.pc-width-fill &gt;
            tbody &gt;
            tr &gt;
            td,
            .pc-w620-gridCollapsed-1.pc-width-fill &gt;
            tr &gt;

            td {
                width: 100% !important;
            }

            .pc-w620-gridCollapsed-1.pc-w620-width-fill &gt;
            tbody &gt;
            tr &gt;
            td,
            .pc-w620-gridCollapsed-1.pc-w620-width-fill &gt;
            tr &gt;

            td {
                width: 100% !important;
            }

            .pc-w620-gridCollapsed-1 &gt;
            tbody &gt;
            .pc-grid-tr-first &gt;
            .pc-grid-td-first,
            pc-w620-gridCollapsed-1 &gt;
            .pc-grid-tr-first &gt;

            .pc-grid-td-first {
                padding-top: 0 !important;
            }

            .pc-w620-gridCollapsed-1 &gt;
            tbody &gt;
            .pc-grid-tr-last &gt;
            .pc-grid-td-last,
            pc-w620-gridCollapsed-1 &gt;
            .pc-grid-tr-last &gt;

            .pc-grid-td-last {
                padding-bottom: 0 !important;
            }

            .pc-w620-gridCollapsed-0 &gt;
            tbody &gt;
            .pc-grid-tr-first &gt;
            td,
            .pc-w620-gridCollapsed-0 &gt;
            .pc-grid-tr-first &gt;

            td {
                padding-top: 0 !important;
            }

            .pc-w620-gridCollapsed-0 &gt;
            tbody &gt;
            .pc-grid-tr-last &gt;
            td,
            .pc-w620-gridCollapsed-0 &gt;
            .pc-grid-tr-last &gt;

            td {
                padding-bottom: 0 !important;
            }

            .pc-w620-gridCollapsed-0 &gt;
            tbody &gt;
            tr &gt;
            .pc-grid-td-first,
            .pc-w620-gridCollapsed-0 &gt;
            tr &gt;

            .pc-grid-td-first {
                padding-left: 0 !important;
            }

            .pc-w620-gridCollapsed-0 &gt;
            tbody &gt;
            tr &gt;
            .pc-grid-td-last,
            .pc-w620-gridCollapsed-0 &gt;
            tr &gt;

            .pc-grid-td-last {
                padding-right: 0 !important;
            }

            .pc-w620-tableCollapsed-1 &gt;
            tbody,
            .pc-w620-tableCollapsed-1 &gt;
            tbody &gt;
            tr,
            .pc-w620-tableCollapsed-1 &gt;

            tr {
                display: block !important;
            }

            .pc-w620-tableCollapsed-1.pc-width-fill &gt;
            tbody,
            .pc-w620-tableCollapsed-1.pc-width-fill &gt;
            tbody &gt;
            tr,
            .pc-w620-tableCollapsed-1.pc-width-fill &gt;

            tr {
                width: 100% !important;
            }

            .pc-w620-tableCollapsed-1.pc-w620-width-fill &gt;
            tbody,
            .pc-w620-tableCollapsed-1.pc-w620-width-fill &gt;
            tbody &gt;
            tr,
            .pc-w620-tableCollapsed-1.pc-w620-width-fill &gt;

            tr {
                width: 100% !important;
            }

            .pc-w620-tableCollapsed-1 &gt;
            tbody &gt;
            tr &gt;
            td,
            .pc-w620-tableCollapsed-1 &gt;
            tr &gt;

            td {
                display: block !important;
                width: auto !important;
            }

            .pc-w620-tableCollapsed-1.pc-width-fill &gt;
            tbody &gt;
            tr &gt;
            td,
            .pc-w620-tableCollapsed-1.pc-width-fill &gt;
            tr &gt;

            td {
                width: 100% !important;
                box-sizing: border-box !important;
            }

            .pc-w620-tableCollapsed-1.pc-w620-width-fill &gt;
            tbody &gt;
            tr &gt;
            td,
            .pc-w620-tableCollapsed-1.pc-w620-width-fill &gt;
            tr &gt;

            td {
                width: 100% !important;
                box-sizing: border-box !important;
            }
        }

        @media (max-width: 520px) {
            .pc-w520-padding-10-30-10-30 {
                padding: 10px 30px 10px 30px !important;
            }

            .pc-w520-padding-10-25-10-25 {
                padding: 10px 25px 10px 25px !important;
            }

            .pc-w520-padding-30-30-30-30 {
                padding: 30px 30px 30px 30px !important;
            }
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
<!--[if !mso]><!-- --><link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i"><!--<![endif]--></head>

<body class="body pc-font-alt" style="width: 100% !important; min-height: 100% !important; margin: 0 !important; padding: 0 !important; line-height: 1.5; color: #2D3A41; mso-line-height-rule: exactly; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-variant-ligatures: normal; text-rendering: optimizeLegibility; -moz-osx-font-smoothing: grayscale; background-color: #f4f4f4;" bgcolor="#f4f4f4">
    <table class="pc-project-body" style="table-layout: fixed; min-width: 600px; background-color: #f4f4f4;" bgcolor="#f4f4f4" width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
        <tbody>
            <tr>
                <td align="center" valign="top">
                    <table class="pc-project-container" style="width: 600px; max-width: 600px;" width="600" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tbody>
                            <tr>
                                <td style="padding: 20px 0px 20px 0px;" align="left" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="width: 100%;">
                                        <tbody>
                                            <tr>
                                                <td valign="top">
                                                    <!-- BEGIN MODULE: Text -->
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding: 0px 0px 0px 0px;">
                                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td valign="top" class="pc-w520-padding-10-30-10-30 pc-w620-padding-10-35-10-35" style="padding: 10px 40px 10px 40px; border-radius: 0px; background-color: #ffffff;" bgcolor="#ffffff">
                                                                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td valign="top" align="left">
                                                                                                    <div class="pc-font-alt pc-w620-lineHeight-134pc" style="line-height: 140%; letter-spacing: -0.1px; font-family: &#39;Inter&#39;, Comic Sans MS, Textile, Cursive, sans-serif; font-size: 15px; font-weight: normal; font-variant-ligatures: normal; color: #4f4f4f; text-align: left; text-align-last: left;">
                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                            <span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px"></span>
                                                                                                        </div>
                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                            <span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px"></span>
                                                                                                        </div>
                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                            <span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px"></span>
                                                                                                        </div>
                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                            <span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px">Hello,</span>
                                                                                                        </div>
                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                            <span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px"></span>
                                                                                                        </div>
                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                            <span style="letter-spacing: -0.1px;" data-letter-spacing-original="-0.1px">
                                                                                                            A commission charge of NGN ${amount} has been successfully billed to your account .&nbsp;

                                                                                                        </div>
                                                                                                    </div>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
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
                    <div><span style="font-weight: 700;font-style: normal;">Here are the payment details : </span>
                    </div>
                    <div><span>&#xFEFF;</span>
                    </div>
                  
                   
                    </div>
                    <ol style="margin: 0; padding: 0 0 0 20px; list-style: disc;">
                       <li style = "flex flex-row justify-content:space-between"><span style="font-weight: 700;font-style: normal;">Order Reference:</span><span> ${reference}</span>
                     </li>
  
                       <li style = "flex flex-row justify-content:space-between"><span style="font-weight: 700;font-style: normal;">Order Amount:</span><span>  NGN${amount}</span>
                     </li>

                       <li style = "flex flex-row justify-content:space-between"><span style="font-weight: 700;font-style: normal;">Order Date:</span><span> ${new Date().toLocaleDateString()}</span>
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
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding: 0px 0px 0px 0px;">
                                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td valign="top" class="pc-w520-padding-10-30-10-30 pc-w620-padding-10-35-10-35" style="padding: 5px 40px 10px 40px; border-radius: 0px; background-color: #ffffff;" bgcolor="#ffffff">
                                                                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td valign="top" align="left">
                                                                                                    <div class="pc-font-alt" style="line-height: 140%; letter-spacing: -0.2px; font-family: &#39;Inter&#39;, Comic Sans MS, Textile, Cursive, sans-serif; font-size: 15px; font-weight: normal; font-variant-ligatures: normal; color: #333333; text-align: left; text-align-last: left;">

                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                            <span>﻿</span>
                                                                                                        </div>
                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                            <span style="font-weight: 400;font-style: normal;">Please reach out to the support team via the customer support icon on the mobile application if you have any questions or have questions about this charge. </span>
                                                                                                        </div>


                                                                                                    </div>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <!-- END MODULE: Text -->
                                                </td>
                                            </tr>

                                            <tr>
                                                <td valign="top">


                                                    <!-- BEGIN MODULE: Footer 7 -->
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding: 0px 0px 0px 0px;">
                                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td valign="top" class="pc-w520-padding-30-30-30-30 pc-w620-padding-35-35-35-35" style="padding: 40px 40px 40px 40px; border-radius: 0px; background-color: #ffffff;" bgcolor="#ffffff">
                                                                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td align="left" valign="top" style="padding: 0px 0px 14px 0px;">
                                                                                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                                                                                        <tbody>
                                                                                                            <tr>
                                                                                                                <td valign="top" align="left">
                                                                                                                    <div class="pc-font-alt" style="line-height: 143%; letter-spacing: -0.2px; font-family: &#39;Inter&#39;, Comic Sans MS, Textile, Cursive, sans-serif; font-size: 14px; font-weight: normal; font-variant-ligatures: normal; color: #9b9b9b; text-align: left; text-align-last: left;">
                                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                                            <span style="font-weight:700;font-style:normal;color:#4f4f4f;font-family:roboto,&#39;helvetica neue&#39;,helvetica,arial,sans-serif;background:#f5f5f5"> </span><strong style="font-weight:700;font-style:normal;color:#4f4f4f;font-family:roboto,&#39;helvetica neue&#39;,helvetica,arial,sans-serif"><span style="background:#f5f5f5">${COMPANY_NAME}</span></strong><span style="font-weight:700;font-style:normal;color:#4f4f4f;font-family:roboto,&#39;helvetica neue&#39;,helvetica,arial,sans-serif;background:#f5f5f5">,</span> 
                                                                                                                        </div>
                                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                                            <span style="font-weight: 700;font-style: normal;color: rgb(73, 73, 73);">$copy;${new Date().getFullYear()}</span><span> </span>
                                                                                                                        </div>
                                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                                            <span style="font-size: 16px;">${COMPANY_ADDRESS}</span>
                                                                                                                        </div>
                                                                                                                        <div esd-text="true" class="esd-text">
                                                                                                                            <span style="font-size: 16px;">All rights reserved.</span>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </td>
                                                                                                            </tr>
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <!-- END MODULE: Footer 7 -->
                                                </td>
                                            </tr>

                                        </tbody>
                                    </table>
                                    <!-- Fix for Gmail on iOS -->
                                    <div class="pc-gmail-fix" style="white-space: nowrap; font: 15px courier; line-height: 0;">&nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                    </div>


                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>


</body></html>
`
};





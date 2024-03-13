import { handleDuplicateAccountFunctions } from "./DuplicateAccountScreen"


const OTPHandler = (props) => { 
    
  const { 
   from,  action , data
} =  props

const [otp, setOtp ] =  useState<string>("")
const [otpId, setOtpId ] =  useState<string>("")
const [mobile, setMobile] =  useState<string>("")
const [email,  setEmail] = useState<string>("")
const [from , setFrom ] =  useState(from ?? "")

const [canSwitchMobile, setCanSwitchMobile ] =  useState<boolean>(data?.canSwitchMobile)



useEffect(() => { 

  const otpId  =  data?.otpId

  const mobile = data?.mobile

  const countryCode = data?.countryCode

   setMobile(`${countryCode}${mobile}`)
   setOtpId(JSON.stringify(otpId))
   setEmail(JSON.stringify(data?.email))

}, [])

const onOTPTextChange = (value) => { 
  setOtp(value)
}

  const { navigate  } =  useNavigation()



  const handleHasChangedMobile = () => { 
   
  

    const { socialEmail , user, email, firstname } = data 

    //There will be a social email if its a social login or an email for normal email logins 


    //send an otp to the email or social account mail attached to this account, then navigate this user to change their mobile on confirmation

    const otpData =  { 
        user, 
        email : socialEmail ?? email,
        next : "MobileNumberScreen"
    }

const otpIdData  =  await axios.post("otpController.createOtp"), 

if(otpIdData.ok){ 

    setOtpId(otpId)
    
    setMobile("")

    setFrom("")
 
     setCanSwitchMobile(prev => !prev ) 

     setEmail(email ?? socialEmail)
     
}


  }

  const resendOTP = () => { 

    //Update the otp 
      const otpDataResponse =  await fetch("OtpController.updateOTP", { 
        otpId, 
        mobile 
      })

      if(otpDataResponse.ok) {
        const data  =  await otpDataResponse.json() 
        setOtpId(prev =>  data.otpId)
      }

    return 
  
  }

  const verifyOTP = () => { 
     
    const otpVerificationResponse  =  await fetch("OtpController.verifyOTP", { otpId, otp}) 
 
    const otpVerificationData  =  await otpVerificationResponse.json() 

   
    if(otpVerificationResponse.status === 200 ) {  

      
        if(!from) { 
            //This is a reset Mobile request  seeking to verify the email before allowing the user to proceed to the mobile screen,  check handleHasChangedMobileFunction 

const navigate("MobileNumberScreen",  { 
  action : "updateMobileOutsideAccount", data : { 
     user : data?.user,
     firstname : data?.user,
     email : data?.email, 
     socialEmail : data?.socialEmail,
     socialType : data?.socialType, 
     socialId : data?.socialId
  }
})



        }


          const info = { 
          ...data, 
          action,
          otpId : undefined, 
        }


         if(from === "EmailForm") { 
              
          handleEmailFromData(otpVerificationData,info)

        }

    
        if(from === "DuplicateAccount") { 
           handleDuplicateAccountFunctions(otpVerificationData, info)
        }

        if(from === "SocialLogin") { 
          
           handleSocialLoginFunctions(otpVerificationData, info)

        }

        if(from === "MobileNumberScreen") { 
          handleMobileEntryScreenFunctions(otpVerificationData, info)
        }


  
  }

        return 
        <>

       { data?.firstname && 
       <View> 
         <Text>`Welcome back { firstname}</Text>
        </View>
        
        }
        { 
       canSwitchMobile && <Pressable onPress =  { handleHasChangedMobile}>
            <Text>Changed your mobile number ? </Text>
         </Pressable>
        }

        {
            email && <Text>{`Enter the code sent to yout email at *******${email.splice(-9)}`}</Text>
        }
<View>
<TextInput />
<TextInput />
<TextInput />
<TextInput />
</View>

<Pressable onPress =  {resendOTP}> 
    <Text> Resend Code in  x time </Text>
    </Pressable>
{ data?.canSendWhatsApp && 
<Pressable onPress =  {resendOTP}> 
    <Text> Send on WhatsApp </Text>
    </Pressable>

}
<View/>


        </> 
        
        
}
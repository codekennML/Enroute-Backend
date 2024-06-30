interface UpdateData { 
  userId? : string, 
  email? : string
  mobile? : string,
  socialId? : string,  
  socialType : "FB" | "GL" | "AP",
}

//1, User wants to login with email 
//2, User wants to change mobile via email or via social 
//User wants to update account with email 
//User is new and is verifying email


const EmailForm = (props : { 
  action : "loginEmail" | "resetMobile" | "updateEmail", 
  data : UpdateData & {}
}) => {

const { action ,  data  } =  props 

 const [email, setEmail ] =  useState(data?.email) 

 const [error, setError ] =  useState("")

 const { navigate } =  useNavigation()

 const handleEmailChange =  (inputText)  => { 
      setEmail(inputText )
 } 
  
 const handleEmailUpdate =  () =>  { 
    

 if(!action){ 
    //This is the main signInpage ,
    
     const response   =  await axios.get("authController.signInEmail" , { 
            email , 
            role :ROLE
     }) 

     if(response.ok) { 
        //send otp to mobile, if there is a mobile \
   
     const { countryCode , mobile,  _id, firstname } =  response 


     if(mobile && firstname){ 
        const otpData =  { 
            user : _id, 
            mobile, 
            countryCode, 
          next : "HomeScreen"
        } 
 
        const otpDataResponse  =  await axios.post("otpController.createOtp", otpData)

        const otpId  =  otpDataResponse.data

        navigate("OTPScreen", { 
            from : "EmailEntryScreen", 
            action : "EmailUserLogin_User_Data_Complete", 
            data : { 
                otpId, 
                countryCode , 
                mobile, 
                 _id, 
                firstname ,
                canSendWhatsApp : true, 
                canSwitchMobile : true

            }
        })

       } 
     
    if(mobile && !firstname) { 
        //Fill out the Name Auth Form 
     
        const otpData  =  { 
            user : _id, 
            countryCode, 
            mobile, 
            type : "SMS",
            next : "NameAuthScreen"
        } 

        const otpDataResponse  =  await axios.post("OtpController.createOtp",  otpData)
        
        const otpId =  otpDataResponse.data 

        navigate("OTPScreen", { 
       from : "EmailEntryScreen", 
       action : "EmailUserLogin_User_No_Name",
       data : { 
            otpId , 
            user : _id, 
            mobile,
            countryCode, 
            type : "SMS",
            canSendWhatsApp : true,
            canSwitchMobile : true
       }
        })

    }  

    if(!mobile && !firstname) { 

        const otpData  =  { 
            user : _id, 
            type : "Email",
            email,
            next : "MobileNumberScreen"
        }

        const otpDataResponse =  await axios.post("OtpController.createOtp", otpData)

        const otpId  =  otpDataResponse.data
        //This is a new user, they need to verify their email first 
    navigate("OTPScreen", { 
            from : "EmailEntryScreen", 
            action : "EmailUserLogin_New_User", data : { 
            otpId , 
            user : _id, 
            email,
            canSendWhatsApp : false,
            canSwitchMobile : false
    }})

    }

     }
  
 }

  if(action === "resetMobile") { 
//This is for resetting mobile before the user logs in , either via email or social login 

 

  //First check for the email, if this action was initiated by a social login , the email will be the email attached to the social account 

  //Every user that can initiate this action already has an account 

  const { user } = data
    const userResponse =  await fetch("userController.getUsers", { 
     user
    }) 

    if(userResponse.ok){ 

      const users   =  await userResponse.json()


         const { _id, firstname, mobile , countryCode, email, _id } =  users[0]

          const otpData  =  { 
          email,
          type : "Email",
          next : "MobileEntryScreen" 
         }

         const otpId =  await fetch("otpController.createOtp", otpData)
   
          
          navigate("OTPScreen",  { 
              from : "EmailForm",
              action : "UpdateUserMobileOutside Account", data : { 
                otpId, 
                email, 
                user : _id
         
              }
   
            })
         }
    }   

}

   if(action === "updateEmail"){ 
        //this is a user trying to update thier email within their account

       const response  =  await axios.get("UserController.getUsers", { 
         email, user : data?.userId }) 
   
       const usersResult   =  await response.json() 
   
       if(usersResult && usersResult?.length > 0 && usersResult[0]?.email === email ) { 
           setError(`The email address is already verified. Please try again with another email address`) 

           return 
       }
      else if ((usersResult && usersResult?.length > 0 && usersResult[0]?.email === email )){ 
           setError(`The email address is associated with another account. Please try again with another email address`)

         return 

       }
         else {
      //create otp here   
   
       const otpData  =  { 
           email,
           type : "Email", 
           user : data.userId, 
           next : "emailVerifiedScreen"
        }
   
       const otpResponse  =  await axios.post("OTPController.createOtp", otpData)
      
      
       if(otpResponse.ok) { 
         const otpId =  await otpResponse.json() 
   
         navigate("OTPScreen", { 
          from : "EmailForm",
          action : "updateEmail_From_User_Account",
          data: { 
             otpId, 
             user : data.userId, 
             canSwitchMobile : false, 
             canSendWhatsApp : false
                       }
         })
       }
     } 
       }
      
    
}
 

//This just takes the users email and creates an otp  


 return <>
 <View>
 <View>
     <TextInput placeholder =  "" value =  {email} onChangeText = { handleEmailChange} />
     {error  && <Text clasName =  "bg-red-500">{ error}</Text>}
 </View>

  <View>
    <TouchableOpacity onPress  =  { handleEmailChange} className =  `bg-green-500`>
        <Text> 
        Continue
        </Text>
    </TouchableOpacity>
  </View>
 </View>
    </>

     

}


export function handleEmailEntryScreenFunctions(otpVerificationData,  navigationData) { 
    
    if(navigationData.action === "EmailUserLogin_User_Data_Complete"){
        //Just log the user in  
   const { user} = navigationData 

    const tokensRes =  await axios.post("authController.assignTokens",  { user})

    if(tokenRes.ok){ 
        return navigate("HomeScreen")
    }  
    

    } 

    if(navigationData.action === "EmailUserLogin_User_No_Name"){
     
        const { user} = navigationData

        return navigate("NameAuthScreen", { user , next : "HomeScreen"})

    }

    if(navigationData.action === "EmailUserLogin_New_User"){
   
     const { user, email } = navigationData 
   //the user should verify their number now that theyhave sent us their email
     return navigate("MobileNumberScreen",  { 
       action : "EnterNewUserMobile", 
       data : { 
        email,
        user
       }
     })

       
    }
  
   
    if(navigationData.action ===   "updateEmail_From_User_Account") { 
        //Just update the user 

        const response  =  await axios.post("UserController.updateUser",  { 
            user : otpVerificationData.user, 
            update : { 
                email : otpVerificationData.email
            }
        }) 

        if(response.ok) { 
            navigate(otpVerificationData.next)
        }
    }
    
}
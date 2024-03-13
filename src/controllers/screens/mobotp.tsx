import { profile } from "winston"

interface UserData  { 
    email : string, 
    mobile : string, 
    firstname?  : string
    _id : string
}

interface SocialData { 
  googleId : string , 
  email : string, 
  firstname? : string, 
  mobile? : string
  accountExists : boolean 
}

interface SocialRedirectData 
  {
    screen : string, 
    data : { 
      firstname? : string,
      mobile? : string, 
      socialId : string
       socialType  : "FB" | "GL" | "AP"}
  }


const SocialLogin = () => { 
     
   const [socialLoginSelected, setSocialLoginSelected] =  useState<string>("")
   const [redirect, setRedirect] =   useState<SocialRedirectData>({})

   const [socialInfo, setSocialInfo] =  useState<>({ })

 const navigation =  useNavigation() 
  const { navigate } =  navigation 


   useEffect(() => { 

 
     navigate(redirect.screen,  redirect.data)
    
   }, [navigate, redirect])
  
  
 
useEffect(() => { 
    
  const { socialId,countryCode, mobile, firstname, socialType, user} =  socialInfo
    
 
  if(socialId && mobile && firstname) { 
    
     
    //Make a request that sets the accessToken
    
// redirectToOTpEntryScreen after sending Otp
  const otpData  = { 
    countryCode, 
    mobile, 
    type : "SMS",
    user,
    next : "HomeScreen",
  }
  const response  =  await fetch("OtpController.createOtp", otpData)

      setRedirect(prev => ({ 
        screen : "OTPScreen", 
        data : { 
          action : "SocialLogin_User_Data_Complete",
          data : socialInfo
        }}))

    } else if (socialId && mobile) { 
      //
  const otpData  = { 
    countryCode, 
    mobile, 
    type : "SMS",
    user,
    next : "NameAuthScreen",
  }
  const response  =  await fetch("OtpController.createOtp", otpData)

    setRedirect(prev => { 
      screen : "OTPScreen", { 
        data : { 
          action : "SocialSignIn_USER_NO_NAME" , 
          data : socialInfo
        }
      
    }}) }
    else { 
    setRedirect(prev => { screen : "MobileOTPEntryScreen", { 
          action : "social",
          data : { 
            ...socialInfo
          }
     
    }})
  }

}, [socialInfo])



  if(socialLoginSelected === "google"){ 
    
    const GoogleData  = await fetch("googlePopup")
    const { _idToken } = googleData 

    const userSocialData : { googleId : string , mobile? : string, firstname? : string, email : string}  =  await fetch("callBackendServerToAuthebticateUserViaGoogle", {idToken}) 
 
    const { googleId, mobile, firstname, email, countryCode, user } =  userSocialData
   
   setSocialInfo(prev => { 
    socialId : googleId, 
    user 
    mobile, 
    firstname, 
    email 
    countryCode,
    socialType : "GL"
   })
  }

  if(socialLoginSelected === "Facebook"){ 

    const facebookData  = await fetch("facebookPopup")
   
    const { accessToken,  email  } = facebookData

    const userSocialData : { accessToken : string , mobile? : string, firstname? : string, email : string}  =  await fetch("authController", { 
      token : accessToken, 
      roles : ROLE,
      email : email
    }) 
 
   const { facebookId, mobile, firstname, email, user } =  userSocialData
    
    setSocialInfo(prev => { 
    socialId : facebookId, 
    mobile, 
    firstname, 
    user,
    email,
    countryCode ,
    socialType : "FB"
   })


  }

  if(socialLoginSelected === "Apple"){ 
      const appleData  = await fetch("applePopup")
   
    const { _idToken } = appleData

    const userSocialData : { appleId : string , mobile? : string, firstname? : string, email : string}  =  await fetch("callBackendServerToAuthenticateUserViaFB", {idToken}) 
 
    const { appleId, mobile, firstname, countryCode, email, user  } =  userSocialData
   
   setSocialInfo(prev => { 
    socialId : appleId 
    mobile, 
    firstname, 
    email,
    user,
    countryCode,
    socialType : "AP"
   })
  }



  return<View>
<GoogleLogin onClick = {} />
<TouchableOpacity onPress =  {(prev) => setSocialLoginSelected("Facebook")}>
<FacebookLogin/>
</TouchableOpacity>
<AppleLogin/>

  </View>


}
 


const MobileNumberEntry = (props : { 
  action : "social" | "login" | "updateMobileWithinAccount" | "updateMobileOutsideAccount",
  data : { 
    mobile? : string
    firstname? : string, 
    user? : string ,
    next? : string,
    countryCode? : string
    email ? : string, 
    socialId?: string, 
    socialType: string
  }
}) =>  { 
   
  const {action,  data } =  props

//This component is used for three things , 
//1 : Regular mobile signup and login 
//2 : Mobile otp entry and confirmation on social signups or signIn 
//Mobile otp on Account mobile update, when the user wants to update their number


//1. action will be login, socialData -  null 

//2. on social signup , there will be social data but no mobile , which will redirect us here  

//3.  on mobile update,  there will be a loggedIn User 



    // useLayoutEffect(() => { 
 
    //     const navigation =  useNavigation() 

    //     //Go to homescreen if all the details have been provided 

    //     //This user used social login to login but the presence of firstname and lastname means they have signed up before, redirect to home screen
    //     if(socialData?.accountExists && firstname && mobile) navigation.navigate("HomeScreen")

    //     //This user used social login to login but the absence of firstname  means they have not signed up before
    //     if(socialData?.accountExists && mobile && !firstname) navigation.navigate("NameAuthScreen")
      
      
    // })

    const [ error ,  setError ] =  useState("")
     const [userMobile, setUserMobile ] =  useState("")
     const [userCountryCode, setUserCountryCode ] =  useState("")
    

    const navigation  =  useNavigation()

    const   { email, firstname } = socialData


  const handleMobileEntry = () =>  { 

    //social login
    if(action === "social" ){ 
       
      //A social signIn will always have the provider ID and email , regardless of whether it is new or existing 
      
      //What we want to check is, if the social data has a firstname   

       const response =  await fetch("getUsersEndpoint",{ 
        countryCode : userCountryCode,
        mobile : userMobile
       } )           
       

       const { user} =  await response.json()
      
      if(user) { 
       //redirect to duplicate screen 
       navigate("DuplicateAccountScreen", { 
        ...data,
       })
      
      } else { 
             
    
     //No user was found having the same mobile so we can send our new registrant an otp 

        //send an otp  to the existing or new number 

        const otpData =  { 
            mobile : userMobile,
            countryCode : userCountryCode,
            type : "SMS",
            user : user?  user?._id : undefined
         }
        

         //send otp for the mobile they will enter here 
        const response   =  await fetch("/otp/send") 

        const otpId  =  await response.json()

        if(otpId) navigation.navigate("OTPScreen", { 
          action : "SignInWithSocial_New_User",
          data  : { 
            ...data,
            countryCode : userCountryCode,
            mobile : userMobile,
            otpId 
          }
        })
      
       } 
      }


//normal login with mobile
     if(action === "login") { 
                  
        //Call the signUserMobile Endpoint here 
           const response : UserData =  await fetch("authController.SignInUserMobile", { 
            countryCode : userCountryCode,
            mobile : userMobile,
            role : ROLE
           }  ) 

          //  const data  =  await response.json()
           //Send the otp here 
            const next =  response?.firstname ?  "HomeScreen" : "NameAuthScreen"

           const otpData  =  { 
            user : response._id,
            countryCode : userCountryCode,
            mobile : userMobile , 
            type : "SMS", 
            next
           }

          //create Otp 
          const otpResponse  =  await fetch("OTPController.createOTP", { ...otpData})

          
          if(otpResponse.ok) 

          const { otpId } = await otpResponse.json()
        
          navigation.navigate("OTPScreen", { 
             
            action : "loginWithMobile", 
            data : {
            otpId, 
            firstname : response?.firstname,
            user : response._id,
            countryCode : userCountryCode,
            mobile : userMobile
             }
          })
        

     }

     if(action === "updateMobileWithinAccount") { 

       const response     =  await fetch("UserController.getUsers", { 
          countryCode : userCountryCode, 
          mobile : userMobile
       } ) //Call to backend api that gets user details, in this case user Controller.getUsers

       const { users } =  await response.json()

       if(users[0]) setError(`This account is associated to another account. Please try with another mobile`)   else { 
    
         //Otherwise send otp , navigate to entry screen and get next  
          
           const otpData  =  { 
            mobile : userMobile,
            countryCode : userCountryCode,
            type : "SMS",
            user : data.user,
            next : "mobileVerifiedScreen"
           }

          //create Otp 
          const otpResponse  =  await fetch("OTPController.createOTP", otpData) 
        
          const otpDataId  = await otpResponse.json() 

     //TODO
          if(otpResponse.ok) { 
            navigation.navigate("OTPScreen",  { 
              action : "MobileUpdate_Within_Account", 
              data : { 
              mobile :userMobile , 
              countryCode : userCountryCode,
              otpId : otpDataId,
              userId : data.user
              }
           
            }
    

            )  
            
          }

       }
     }

     if(action === "updateMobileOutsideAccount"){ 
       //This happens when a user wants to reset their mobile before they login,say their number has changed  


       const { email,  user } =  data 
          
       const userData =  await fetch("UserController.getUsers", { 
         mobile : userMobile, 
         countryCode : userCountryCode
       }) 

       if(user) { 
        //Redirect to duplicate Data screen  
        navigate("DuplicateScreen", { 
          mobile : userMobile, 
          countryCode : userCountryCode,
          email : data.email
        })
       }

     }
}
     
    return 
    <>

       <View>
        <TextInput placeholder =  "Enter your mobile number " onChangeText = {setUserMobile(value) }/>
       </View>

       { 
       
       action === "login" && <View>
       <Text>Send via sms</Text>
       <Text>Send via WhatsApp</Text>

       </View>  }

       { 
       error && <View>
        <Text>{error}</Text>
       </View>
       }
       <View>

       </View>

        <View className =  `bg-green-500 ${isMain ? `flex-1` : "mt-20"}`>
            <Text>Gofar will not send anything without your consent </Text>
            <TouchableOpacity onPress =  {handleMobileEntry} className = `bg-green-400 `>
               <Text> Continue </Text>
            <TouchableOpacity/>
        </View>
     </>

}


interface UpdateData { 
  userId? : string, 
  email? : string
  mobile? : string,
  socialId? : string,  
  socialType : "FB" | "GL" | "AP",
}

const EmailForm = (props : { 
  action : "loginEmail" | "resetMobile" | "updateEmail", 
  data : UpdateData & {}
}) => {

const { action ,  data  } =  props 

  //New User 
  //MobileReset 
  //login
  //EmailUpdate

 const [email, setEmail ] =  useState(data?.email) 

 const [error, setError ] =  useState("")

 const { navigate } =  useNavigation()

 const handleEmailChange =  (inputText)  => { 
      setEmail(inputText )
 } 
  

 const handleEmailUpdate =  () =>  { 
    
  if(action === "resetMobile") { 

    //We need the user to validate their email before we can update the account mobile. So they will enter their email and we will send an otp to them

    const otp =  { 
      email, 
      type : "Email", 
      next : "MobileOTPEntryScreen"
    }

  const {otpId } =  await fetch("otpController.createOtp", otpData)
   
  navigate("OTPScreen", { 
    action : "resetMobile_From_Email_Form", 
    data : { 
      email , 
      otpId, 
      socialId : data?.socialId, 
      socialType : data?.socialType
    }
  })

}

    if(action === "loginEmail") { 
       //We just want to fetch the users data and send an otp to their mobile, if they have a mobile 
   
          const response  =  await fetch("authController.signInUserEmail", { 
            email, 
            role : ROLE
          })
      
          const userData =  await response.json()
         

          const { firstname, email, mobile, countryCode, _id } = userData
          //Two things, if mobile , send otp to mobile, if not mobile , redirect to mobile otp entry screen

          if(countryCode && mobile) { 
            
            const otpData  =  { 
              user : _id, 
              type :  "SMS",
              countryCode,
              email
            }

            const otpResponse  =  await fetch("OtpController.createOtp",  otpData)
           
            const { otpId }   = await otpResponse.json().

            navigate("OTPScreen",  { 
              action : "loginWithEmail_Mobile_Exists", data : { 
                otpId, 
                email, 
                user : _id
              }
   
            })
          }else {
        
      
            //create the otp and send to the email 
              const otpData  =  { 
              user : _id, 
              type :  "Email",
              email
            }

            const otpResponse  =  await fetch("OtpController.createOtp",  otpData)
           
            const { otpId }   = await otpResponse.json().

            navigate("OTPScreen",  { 
              action : "loginWithEmail_Mobile_Not_Exists", data : { 
                otpId, 
                email, 
                user : _id
              }
   
            })
          }
     }

   if(action === "updateEmail"){ 
        //this is a user trying to update thier email within their account

       const response  =  await fetch("UserController.getUsers", { 
         email, user : data?.userId }) 
   
       const usersResult   =  await response.json() 
   
       if(usersResult && usersResult?.length > 0 ) { 
           setError(`The email address is associated with another account. Please try again with another email address`)
       }  else {
      //create otp here   
   
       const otpData  =  { 
           email,
           type : "Email", 
           user : data?.userId, 
           next : "emailVerifiedScreen"
        }
   
       const otpResponse  =  await fetch("OTPController.createOtp", otpData)
      
      
       if(otpResponse.ok) { 
         const otpId =  await otpResponse.json() 
   
         navigate("OTPScreen", { 
          action : "updateEmail_From_User_Account",
          data: { 
             otpId, 
             user : data.userId
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


const OTPHandler = (props) => { 
    
  const { 
    action , data 

    // socialLoginData,
    // socialMobileOtpData, 
    // emailUpdateData,
    // mobileUpdateData,
    // loginData,
    // duplicateData
} =  props

const [otp, setOtp ] =  useState<string>("")
const [otpId, setOtpId ] =  useState<string>("")
const [mobile, setMobile] =  useState<string>("")

useEffect(() => { 

  const otpId  =  data?.otpId

  const mobile = data?.mobile

  const countryCode = data?.countryCode

   setMobile(`${countryCode}${mobile}`)
   setOtpId(JSON.stringify(otpId))

}, [])

const onOTPTextChange = (value) => { 
  setOtp(value)
}

  const { navigate  } =  useNavigation()

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

    //react-native-otp-entry
  
    if(otpVerificationResponse.status === 200 ) {  
     
     
      const socialIdToUpdate   =  data?.socialType === "GL"? "googleId" :data?.socialType === "FB"? "fbId" : "appleId" 
     //we got here from the mobile otp entry page
        if(data && data.userId){ 
          
             //This account had entered an existing mobile number while creating their social account, so just update the account that existed 

         
             const updatedAcccountResponse =  await fetch ("UserController.updateUser", {
            userId : data.userId, 
            update : { 
              [socialIdToUpdate] : data.socialId, 
              email : data.email,
              mobile  : data.mobile
            }
      
           })   

           const { firstname, _id } =  updatedAcccountResponse
    
           if(!firstname) { 
            return navigate("NameAuthScreen", { 
              user : _id
            })
          } else { 
           

              //Make a call to set the authTokens

            await fetch("authController.assignTokens", { user : _id})
             return navigate("HomeScreen")

           }
        }
  //we fot here from the mobile otp entry page
        if(data && !data.userId) { 
          //this user  entered a non existing number so we just need to create the account newly 

            //Create the user here 
             const response   =  await fetch("UserController.createUser" ,  {
              
              [socialIdToUpdate] : data.socialId, 
              email : data.email,
              mobile  : data.mobile,
              roles : ROLE //This will be set in the env file of the app
             })

            const{  user }  =  await response.json() 
    
            //If the user has not registered before, this will be empty , which will mean we need them to provide their names
            if(!user?.firstname ) return navigate("NameAuthScreen",  { 
                next : "HomeScreen"
            })
            
        }

        //We got here from the social signin page directly
       if(socialLoginData && otpVerificationData.next === "HomeScreen"){
        //Call the assign tokens endpoint 

     const result =    await fetch("authController.assignTokens",  { otpVerificationData.user})
        if(result.ok){ 
          navigate("HomeScreen")
        }
   
       } 

       if(socialLoginData && otpVerificationData.next === "NameAuthScreen") { 
        navigate("NameAuthScreen",  { 
          user : socialLoginData.user, 
          next : "HomeScreen"
        })
       }



       if(duplicateData && duplicateData?.user) {
         //Update the existing account with the new info 

         const updatedUser  = await fetch("userController.updateUser", { 
          userId : duplicateData.user , 
          update : { 
            ...duplicateData
          }
         })
        //Set the users tokens 
   const response =       await fetch("authController.assugnTokens", { user : duplicateData.userId})

         if(response.ok) navigate("HomeScreen")

       }

       if(duplicateData && !duplicateData?.user) {
          //delete the existing account and create a new one , since the user is saying that the account we found is not thiers

         const updatedUserResponse  = await fetch("authController.replaceAccount", { 
  
            ...duplicateData,
            role : ROLE //from env of app
          }
         )

         if(response.ok){ 
          const { newUser } =  await updatedUserResponse.json()
      
          navigate("NameAuthScreen", { 
            user : newUser, 
            next : "HomeScreen"
          } )
       
         }

         
       }


        //the user is trying to update their account from within their account
       if(emailUpdateData) { 
          //Update the user email 
        const response  = await fetch("UserController.updateUser" ,  { 
            userId : emailUpdateData.userId,
            update : { 
               email : email
            } 
        })
        
        const data =  await response.json() 

        if(data && otpVerificationData?.next  === "emailVerifiedScreen") {

            navigate("emailVerifiedScreen")
        }


       }

       //this user wants to update their  mobile to another from within their account
       if(mobileUpdateData) { 
         const data  =  await fetch("UserController.updateUser",{ 
          userId : mobileUpdateData.userId,
          update : { 
            countryCode : mobileUpdateData.countryCode, 
            mobile : mobileUpdateData.mobile
          }
         } )
       }

     //This is definitely a login
        navigate(otpVerificationData.next, { 
            user : loginData.userId, 
            next : loginData.next
        })
      
    }
    
  }

        return 
        <>
       { firstname && 
       <View> 
         <Text>`Welcome back { firstname}</Text>
        </View>
        
        }
<View>
<TextInput />
<TextInput />
<TextInput />
<TextInput />
</View>

<Pressable onPress =  {resendOTP}> 
    <Text> Resend Code in  x time </Text>
<View/>


        </> 
        
        
}





const NameAuthScreen = ({ user, next }) => { 

const { navigate } =  useNavigation()

const [ userInfo, setUserInfo ] =  useState<{ firstname : string, lastname : string}>({ 
  firstname : "",
  lastname : ""
}) 


const updateData  =  (name, value) => {
 
  setUserInfo (prev =>  { 
    ...prev, 
    [name] : value
  })
 }

const handleNameData = () => { 

  const updateUserData =  await fetch("UserController.updateUser",  { 
    userId : user, 
    update : { 
      firstname, 
      lastname
    }
  } )

  
  if(updateUserData.ok) { 

    const {  _id } = updateUserData  

    await fetch("authController.assignTokens", {user : _id })

    navigate(next)
    
  } 

} 


return (
<View>
<TextInput placeholder =  "FirstName"/>
<TextInput placeholder =  "LastName" />
  
<Pressable onPress =  { handleNameData}>
  <Text>Continue</>
</Pressable>

</View>
)

}

interface Profile{ 
mobile  : string 
socialId : string , 
email? : string,
socialType : string 
countryCode : string 
user? : string
firstname? : string 

}

const DuplicateAccountSelectionScreen = (profile : Profile) => { 

//This component will only ever be triggered if a user enters a mobile that is already existing in their login journey

const [shouldCreateNewProfile, setShouldCreateNewProfile] =  useState<boolean>(false)

const [shouldUpdateExistingProfile, setShouldUpdateExistingProfile] =  useState<boolean>(false)

const handleDuplicateAccount = () => { 

     let dataToPassToOTpScreen =  { 
      ...profile, 
      socialId : undefined, 
      socialType : undefined
     }

    if(profile?.socialId) { 
         if(profile.socialType  ===  "FB") { 
          dataToPassToOtpScreen.fbId =  profile.socialId
         }
         if(profile.socialType  ===  "GL") { 
          dataToPassToOtpScreen.googleId =  profile.socialId
         }
         if(profile.socialType  ===  "AP") { 
          dataToPassToOtpScreen.appleId =  profile.socialId
         }
    }


    if(shouldCreateNewProfile){ 
      //We are deleting the previous account and starting  a new account
     //Send otp here 


     const otpData =  {
      mobile : profile.mobile, 
      countryCode : profile.countryCode, 
      type : "SMS",
      next : "NameAuthScreen"
     }

     const otpId =  await fetch("OtpController.createOtp", { otpData})

     navigate("OTPScreen",  {
      action : "duplicateAccountData",
      data : { 
       ...dataToPassToOtpScreen
      }
     })

    }

    if(shouldUpdateExistingUser) { 

  const otpData =  {
      mobile : profile.mobile, 
      countryCode : profile.countryCode,
      user: profile.user
      type : "SMS",
      next : "HomeScreen" //There is an existing user 
     }

     const otpId =  await fetch("OtpController.createOtp", { otpData})

     navigate("OTPScreen",  { 
      action : "duplicateAccountData",
      data : { 
    ...dataToSendToOtpScreen
      }
     })
    }

  }



return 
<>
  <View>

  <View>
    <Text>We found an existing account</Text>
  </View>
   
  <Pressable onPress= {() => { setShouldUpdateExistingAccount(prev => !prev)}}>
 
   <View>
    <Text>Aike Kennaya</Text>
    <Text>070787484755</Text>
    <Text>aike@kennaya.com</Text>
   </View>
   <Pressable/>
   
   <Pressable onPress= {() => { setShouldCreateNewAccount(prev => !prev)}}>
   <View>
    <Text>Aike Kennaya</Text>
    <Text>070787484755</Text>
    <Text>aike@kennaya.com</Text>
   </View>

      <View>
      <Text>This is not account</Text>
    </View>
   </Pressable>

  </View>
</>

}
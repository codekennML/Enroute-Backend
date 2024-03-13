const MobileNumberEntry = (props : { 
  action : "social" | "EnterNewUserMobile" | "updateMobileWithinAccount" | "updateMobileOutsideAccount",
  data : { 
    mobile? : string
    firstname? : string, 
    user? : string ,
    next? : string,
    countryCode? : string
    email ? : string, 
    socialId?: string, 
    socialEmail? : string
    socialType: string,
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




    const [ error ,  setError ] =  useState("")
     const [userMobile, setUserMobile ] =  useState("")
     const [userCountryCode, setUserCountryCode ] =  useState("")
    

    const navigation  =  useNavigation()


  



  const handleMobileEntry = () =>  { 

    //social login
    if(action === "social" ){ 
       
     //we only come to this component from the social signin page if the user has no mobile, which means this is a signup  


     //check if this mobile has been assigned to another account
       const response =  await axios.post<>("userController.getUsers",{ 
        countryCode : userCountryCode,
        mobile : userMobile,
        role : ROLE
       } )           
       

       const { users} =  await response.json() 
      
       //If the mobile belongs to an account , we want to inform the user that this number exists and is registered to someone else, so if they can confirm if the  account found is theirs
      if(user[0]) { 

       //redirect to duplicate screen, the duplicatre secren will recieve two types of data ,  the current user trying to sign up and the account just found 
       navigate("DuplicateAccountScreen", { 
        existingAccount : users[0], 
        newAccount : { ...data},
        type : "socialLogon"
  
       })
      
      } else { 
             
     //No user was found having the same mobile so we can send our new registrant an otp 

        //send an otp  to the new number 

        const otpData =  { 
            mobile : userMobile,
            countryCode : userCountryCode,
            type : "SMS",
            next : "NameAuthScreen" //This user only got sent here beacuse they did not have a mobile and a firstname,  now they have entered a mobile that has not been used ,  so once we verify their mobile on the otp screen, they need to fillout their  names
         }
        

         //send otp for the mobile they  entered here 
      const otpId    =  await axios.post("otpController.createOtp", otpData)
  
      const socialAccountType =  data.socialType === "AP" ? "appleId" : data.socialType === "GL" ? "googleId" : "fbId"
   
    const socialEmailType =  data.socialType === "AP" ? "appleEmail" : data.socialType === "GL" ? "googleEmail" : "fbEmail"


      const creationData =  { 
         [socialAccountType] : data.socialId, 
         [socialEmailType] : data.socialEmail,
         role : ROLE,
         countryCode : userCountryCode,
         mobile : userMobile,
      }

         navigation.navigate("OTPScreen", { 
          from : "MobileNumberScreen", 
          action : "createNewAccount_With_New_Social_Data",
          data  : { 
            otpId,  
            creationData
          }
        })
      
       } 


    }

   if(action === "EnterNewUserMobile") { 
     

     const { user, email } = data

     const result  = await axios.get("usersController.getUsers", { 
        mobile : userMobile,
        countryCode : userCountryCode, 
        role : ROLE
     })
  
     if(result.ok) { 
       const { users  } =  result.data 

   if(users[0]) {

    //Straight to duplicateScreen 
    navigate("DuplicateAccountScreen", { 
        type : "mobileUpdateNewUser", 
        existingAccount : { 
        ...users[0],
        }, 
        newAccount : { 
            user, email , mobile : userMobile, 
            countryCode : userCountryCode
        }
    })


   }

    }
    
   
    const otpData = { 
      countryCode : userCountryCode, 
      mobile : userMobile, 
      user,
      next : "OTPScreen"
    } 

    const otpDataResponse  =  await axios.post("otpController")

    const { otpId } =  otpDataResponse.data
  
    return navigate("OTPScreen", { 
        from : "MobileNumberScreen",
        action : "VerifyNewUserMobile",
        data : { 
            otpId, 
            user,
            countryCode : userCountryCode, 
            mobile :userMobile, 
            email,
            canSendWhatsApp : false,
            canSwitchMobile : false
        }
    })


   }
    
     if(action === "updateMobileWithinAccount") { 

       const response     =  await axios.post("UserController.getUsers", { 
          countryCode : userCountryCode, 
          mobile : userMobile,
          role : ROLE
       } ) //Call to backend api that gets user details, in this case user Controller.getUsers

       const { users } =  await response.json()

  if (`+${users[0].countryCode}${users[0].mobile}` === `+${userCountryCode}${userMobile}` && users[0].mobileVerified){
setError(`This mobile number has been verified. Please try with another mobile`)
      }     
       else if(users[0]) { setError(`This account is associated to another account. Please try with another mobile`)
    }

       else { 
    
         //Otherwise send otp , navigate to entry screen and get next  
          
           const otpData  =  { 
            mobile : userMobile,
            countryCode : userCountryCode,
            type : "SMS",
            user : data.user,
            next : "mobileVerifiedScreen"
           }

          //create Otp 
          const otpResponse  =  await axios.post("OTPController.createOTP", otpData) 
        
          const otpDataId  = await otpResponse.json() 

     //TODO
          if(otpResponse.ok) { 
            navigation.navigate("OTPScreen",  { 
              from :  "MobileNumberScreen",
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

     const { email, user, socialEmail, socialType, socialId, firstname} =  data 
          
       const userDataResponse =  await axios.get("UserController.getUsers", { 
         mobile : userMobile, 
         countryCode : userCountryCode,
         role : ROLE
       }) 

      if (userDataResponse.ok){
       
         


        const userData =  userDataResponse.data[0] 


        const social = socialType === "AP"?"appleId" : socialType === "FB" ? "fbId" : "googleId"

        if(userData.email === email || userData[social] === socialId){  setError("You already have this mobile assigned to your account.Please login instead") 
   return 
      }

        if(userData) {  

      return   navigate("DuplicateAccountScreen", { 
        type : "updateMobile", 
        existingAccount : { ...userData}, 
        newAccount : { 
            email, user, firstname, mobile : userMobile, countryCode : userCountryCode, 
            socialEmail, 
            socialId,
            socialType
        }
      })

            
    //send to duplicate Screen  
       } 
       else { 

        //Send otp and navigate to otp screen for confirmation

      const otpInfo  =  { 
        type : "SMS",
        countryCode : userCountryCode, 
        mobile : userMobile
    
      }
        
        const otpId =  await fetch("OtpController.createOtp", otpInfo)

        navigate("OTPScreen", { 
          from : "MobileEntry",
          action : "create_new_user_with_email_&_mobile", 
          data : { 
            countryCode : userCountryCode, 
            mobile : userMobile, 
            email 
          }
        })

       }

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
   
        <View className =  `bg-green-500 ${isMain ? `flex-1` : "mt-20"}`>
            <Text>Gofar will not send anything without your consent </Text>
            <TouchableOpacity onPress =  {handleMobileEntry} className = `bg-green-400 `>
               <Text> Next </Text>
            <TouchableOpacity/>
        </View>
     </>

}




export function handleMobileEntryScreenFunctions = (otpVerificationData, navigationData)  => {
    

if(navigationData.action === "createNewAccount_With_New_Social_Data"){
   //We are creating a new account here with mobile, the countryCode , the social id , the social email created during social signin 
const { creationData } = navigationData

   const  response  =  await axios.post("UserController.createUser",  creationData) 
  
 if(response.ok) { 
    //user has been created , all we need to do now is get their name 
    navigate("NameAuthScreen" ,  { 
        user : response._id, 
        next : "HomeScreen"
    })
 }

}

if(navigationData.action === "VerifyUserNewMobile") { 
    
    const { email, countryCode, mobile, user } = navigationData 

//The user has verified both their mobile and email here

    const updatedUserResponse   = await axios.post("userController.updateUser" ,  { 
        userId : user , 
        update : { 
            mobile, 
            countryCode , 
            email, 
            emailVerified : true, 
            mobileVerified : true 
        }
    })
 
if(updatedUserResponse.ok) { 
    //Navigate to the NameAuthScreen so they can enter their name 
    return navigate("NameAuthScreen", { 
        next : "HomeScreen", 
        user 
    })
}



}
 
if(navigationData.action ===  "MobileUpdate_Within_Account"){ 

      //Just update the user 

        const response  =  await axios.post("UserController.updateUser",  { 
            user : otpVerificationData.user, 
            update : { 
            mobile : otpVerificationData.mobile,
            countryCode : otpVerificationData.mobile
            }
        }) 

        if(response.ok) { 
            navigate(otpVerificationData.next)
        }
    }

}
 

}


const DuplicateAccountSelectionScreen = (props) => { 

    
const { existingAccount, newAccount, type  } =  props 
//This component will only ever be triggered if a user enters a mobile that is already existing in their login journey

const [shouldCreateNewProfile, setShouldCreateNewProfile] =  useState<boolean>(false)

const [shouldUpdateExistingProfile, setShouldUpdateExistingProfile] =  useState<boolean>(false)

const handleDuplicateAccount = () => { 

        const socialAccountType =  newAccount?.socialType === "AP" ? "appleId" : newAccount?.socialType === "GL" ? "googleId" : "fbId"
   
    const socialEmailType =  newAccount?.socialType === "AP" ? "appleEmail" : newAccount?.socialType === "GL" ? "googleEmail" : "fbEmail"



  
if(type === "socialLogon") {
  
  
  if(shouldUpdateExistingProfile) { 
        //it means we should update existing account with the current social data  

  
    const otpData =  { 
        user : existingAccount._id,
        mobile : newAccount?.mobile, //This can be goteen from any of the accounts since they have the same data
        countryCode : newAccount?.countryCode,
        next : "HomeScreen"
    }

    const otpId  =  await axios.post<string>("OtpController.createOtp")
//Navigate to the otp screen with the data to update , which will be done after the otp is verified

 const updateData =  {
    [socialAccountType] : newAccount.socialId, 
    [socialEmailType] : newAccount.socialId, 
    user :existingAccount._id 
 }

    navigate("OTPScreen", { 
        from : "DuplicateAccountScreen", 
        action : "updateExistingAccount_With_New_Social_Data",
        data : { 
           otpId,
          firstname : existingAccount?.firstname,
           countryCode : newAccount.countryCode, 
           mobile : newAccount.mobile,
           canChangeMobile : false, 
           canSendWhatsApp : true,
           updateData
        }
    })

} 

if(shouldCreateNewProfile) { 
    //We need to expunge or delete the previous account  

     const otpData =  { 
        mobile : newAccount?.mobile, 
        countryCode : newAccount?.countryCode,
        next : "NameAuthScreen"
    } 

     const otpId  =  await axios.post<string>("OtpController.createOtp")

     const creationData =  { 
    [socialAccountType] : newAccount.socialId, 
    [socialEmailType] : newAccount.socialId,
    mobile : newAccount?.mobile, 
    countryCode : newAccount?.countryCode,
    role : ROLE
     }

     navigate("OTPScreen", { 
        from : "DuplicateAccountScreen", 
        action : "createNewAccount_With_New_Social_Data",
        data : { 
        otpId,
           countryCode : newAccount.countryCode, 
           mobile : newAccount.mobile, 
           canChangeMobile:false, 
           creationData,
        }
    })


}

}

if(type === "mobileUpdate"){ 

    if(shouldUpdateExistingProfile){ 
     
      const  otpData =  { 
         user : existingAccount._id, 
         mobile : newAccount?.mobile, 
         countryCode : newAccount?.countryCode,
         next : "HomeScreen"
      }
   
      const otpId =  await axios.post("otpController.createOtp") 

//Since this can be either a social or email journey, either of bothe will be present
    const updateData =  {
    [socialAccountType] : newAccount?.socialId, 
    [socialEmailType] : newAccount?.socialId, 
    email :  newAccount?.email,
    user :existingAccount._id 
 }


     return  navigate("OTPScreen", { 
        from : "DuplicateAccountScreen", 
        action : "updateExistingAccount_mobile_update",
        data : { 
           otpId,  
          firstname : existingAccount?.firstname,
           countryCode : newAccount.countryCode, 
           mobile : newAccount.mobile,
           canChangeMobile : false, 
           canSendWhatsApp : true,
           updateData, 
           userToDelete : newAccount._id

        }
     })

    }

    if(shouldCreateNewProfile){ 

  const  otpData =  { 

         user : newAccount._id, 
         mobile : newAccount.mobile, 
         countryCode : newAccount.countryCode,
         next : newAccount?.firstname ? "HomeScreen" : "NameAuthScreen"
      }
   
      const otpId =  await axios.post("otpController.createOtp") 

     const updateData =  { 
    [socialAccountType] : newAccount?.socialId, 
    [socialEmailType] : newAccount?.socialId,
    mobile : newAccount.mobile, 
    countryCode : newAccount.countryCode,
    role : ROLE ,
    email : newAccount?.email,
    firstname : newAccount?.firstname
     }

     navigate("OTPScreen", { 
        from : "DuplicateAccountScreen", 
        action : "createNewAccount_mobile_update",
        data : { 
        otpId,
           countryCode : newAccount.countryCode, 
           mobile : newAccount.mobile, 
           canChangeMobile:false, 
           canSendWhatsApp : false,
            updateData,
           userToDelete : existingAccount._id
        }
    })

    }
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
    <Text>`{profile.firstname} ${profile.lastname}`</Text>
    <Text>`+{profile.countryCode}${profile.mobile}`</Text>
    <Text>{profile.existingUserEmail}</Text>
   </View>

   <Text>Continue with this account</Text>
   <Pressable/>
   
   <Pressable onPress= {() => { setShouldCreateNewAccount(prev => !prev)}}>
   <View>
 <Text>Not your account ? </Text>
   </View>

      <View>
      <Text>This is not account</Text>
    </View>
   </Pressable>

  </View>
</>

}



export async function handleDuplicateAccountFunctions(otpVerificationData, navigationData) {
  
  
   if(navigationData.action === "createNewAccount_With_New_Social_Data"){ 

     const { creationData } = navigationData
 
 //We are replacing the previous account and inserting this new one
   const  response  =  await axios.post("authController.replaceAccountViaMobile",  creationData) 


   if(response.ok) { 

    const { newUser } =  response

    navigate("NameAuthUser", { 
      user : newUser, 
      next : "HomeScreen"
    })
} 

    

}  
//this is for when a user enters an existing mobile but because we dont create accounts until both emails and mobile are verified for social logins, there would be no need to delete the new account 
if(navigationData.action === "updateExistingAccount_With_New_Social_Data") { 


    const { updateData } = navigationData 

    const { user,  ...rest } =  updateData 

    //Update the user data 

    const response =  await axios.post("userController.updateUser", { 
        userId : user, 
        update : { 
            ...rest
        }
    })
    
    if(response.ok) { 
        //since its an existing user ,  they will definitely already have a firstname and lastname
   const res =      await axios.post("authController.assignTokens",  { 
            user
        })

        if(res.ok) navigate("HomeScreen")
    }


}
 
//We need to delete or replace one of the accounts here
if(navigationData.action === "updateExistingAccount_mobile_update" ) { 

    //we will delete the new acccount and update the existing one 

    const { userToDelete ,  updateData} =  navigationData 

    const response  =  await axios.post("authController.replaceAccountById", { 
       userToDelete, 
       updateData
    }  )

    if(response.ok) { 
        //assugn tokens tokens 
      const tokenRes =   await axios.post("authController.assignTokens", { user : updateData.user})
 
  return navigate("HomeScreen")

    } 

} 

//We need to delete or replace one of the accounts here
if(navigationData.action === "createNewAccount_mobile_update" ) { 

    //we will delete the existing  acccount and update the existing one 

       //we will delete the existing account and update the current one 

    const { userToDelete , updateData } =  navigationData 

    const response  =  await axios.post("authController.replaceAccountById", { 
       userToDelete, 
       updateData
    }  )

    if(response.ok) { 

        if(otpVerificationData.next === "HomeScreen") { 
            //assugn tokens tokens 
          const tokenRes =   await axios.post("authController.assignTokens", { updateData.user})
     
      return navigate("HomeScreen")

        } else { 
            return navigate("NameAuth",  { 
                user : updateData.user
            })
        }

    } 



} 


}
import { StatusCodes, getReasonPhrase } from "http-status-codes"
import { scyllaDBClient } from "../config/connectDB"
import AppError from "../middlewares/errors/BaseError"



type DriverChunk { 
    tripId  : string
}

type RiderChunk { 
    rideId  : string
  
}

interface DataChunk {
    
    polyline : string, 
    timestamps : Date[]
    createdAt : Date
    user : DriverChunk | RiderChunk

}


class RouteService{ 



    
    async saveRouteLocationDataChunk(chunk : DataChunk){
        

         const { user,  polyline, timestamps } =  chunk  

         if(user.rideId){ 

          const query  =  `INSERT INTO RIDEROUTECHUNK(rideId, polyline, timestamps, createdAt ) VALUES(?, ?,?,?)` 
          

          const params  =  [user.rideId, polyline, timestamps, new Date().toISOString()] 
    

          await scyllaDBClient.execute(query, params ,  { prepare : true})

         }

         if (user.tripId) { 
            
             const query  =  `INSERT INTO RIDEROUTECHUNK(tripId, polyline, timestamps, createdAt ) VALUES(?, ?,?,?)` 
          

          const params  =  [user.tripId, polyline, timestamps, new Date().toISOString()] 
    

          await scyllaDBClient.execute(query, params ,  { prepare : true})

         }
    
 
    }

    async getDriverRouteData(tripId){
       
        const query  =  `SELECT * FROM TRIPROUTECHUNK(tripId) VALUES(?)`
        
        const params =  [ tripId ]

        //couple the data together recreate the trip   

        const data  =  await scyllaDBClient.execute(query, params, { prepare : true})  

        if(!data) throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND),StatusCodes.NOT_FOUND ) 
    

       return data 

    } 

    async getRiderRouteData(rideId : string) {
        
        const query  =  `SELECT * FROM RIDEROUTECHUNK(tripId) VALUES(?)`
        
        const params =  [ rideId ]

        //couple the data together recreate the trip   

        const data  =  await scyllaDBClient.execute(query, params, { prepare : true})  

        if(!data) throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND),StatusCodes.NOT_FOUND ) 
    

       return data 

    }  



    }  
 

export const RouteServiceLayer =  new RouteServiceLayer()

export default RouteService
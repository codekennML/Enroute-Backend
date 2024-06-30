import sharp from "sharp"
import fs from "node:fs"
import { putObjectR2 } from "../../services/3rdParty/Cloudflare/r2"
import { errorLogger } from "../../middlewares/logging/logger"

type ImageData =  {
    filePath: string, bucketName: string, userId: string, fileOriginalName: string
}

const processImageFile = async (message : ImageData) => {


        const processedImageBuffer = await sharp(message.filePath).resize({
            width : 1200, 
            height : 800, 
            fit : 'inside'
        }).webp({quality : 80}).toBuffer()
        
    await fs.unlinkSync(message.filePath)
         
    const objectKey = `images/${message.userId}/${message.fileOriginalName.replace(/\.[^/.]+$/, '')}.webp`
        
     await putObjectR2(message.bucketName, objectKey, processedImageBuffer)
       
        return { name : objectKey} 
}

process.on("message", async(message : ImageData & { type : string}) => { 

     if(message.type === "upload"){ 
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const   { type, ...rest } = message 
            
          const  result =   await processImageFile(rest)
        if(process.send){
             process.send({
        success: true,
        uri : result.name 
    })

}
        }
        catch (e: unknown) {

        errorLogger.error(`File upload error : user - ${message.userId}- message - ${(e as Error).message}`)
            if (process.send) {
         process.send({ 
            success : false , 
         })
        }
         }
     }
})
import {
    S3Client,
    ListBucketsCommand,
    ListObjectsV2Command,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";



const R2_ACCESS_KEY =  process.env.R2_ACCESS_KEY as string
const R2_SECRET_KEY = process.env.R2_SECRET_KEY as string
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID as string

const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY,
        secretAccessKey: R2_SECRET_KEY,
    },
});



export async function putObjectR2 (bucketName : string, fileKey : string, fileContent  : Buffer) {

    const data =  { 
        Bucket : bucketName, 
        Key : fileKey, 
        Body: fileContent
    }
 
    const response = await await S3.send(
        new PutObjectCommand(data)
    )

    return response
}

export async function listR2Buckets(){
    const bucketsData = await S3.send(
        new ListBucketsCommand({})
    )

  return bucketsData 
}

export async function listObjectsInR2Bucket(bucketName : string ){ 

    const bucketObjects =  await S3.send(
        new ListObjectsV2Command({ Bucket: bucketName })
    )

    return bucketObjects

}

export async function retrieveObjectFromR2Bucket (bucketName: string, key : string){
    const object = await S3.send(
        new GetObjectCommand({ Bucket: bucketName, Key: key })
    )
    
    
    return object
}

export async function deleteObjectFromR2Bucket(bucketName : string,  fileName : string, ){

    const response = await S3.send(
        new DeleteObjectCommand({ Bucket: bucketName, Key: fileName })
    )
    
    return response
}


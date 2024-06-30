import {  rateLimit } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import  redisClient  from "../../services/redis"

export const apiLimiter  =  rateLimit({
    windowMs : 15* 60 * 100, 
    limit : 60, 
    standardHeaders : true, 
    legacyHeaders : false, 
     store : new RedisStore({
        //@ts-expect-error the call function isnt present in ioredis 
        sendCommand: (...args: string[]) => redisClient.call(...args,)
    })

})

export const otpLimiter  =  rateLimit({ 
    windowMs: 1 * 60 * 100,
    limit: 1,
    standardHeaders: true,
    legacyHeaders: false, 
    store : new RedisStore({ 
        //@ts-expect-error the call function isnt present in ioredis 
        sendCommand : (...args: string[] ) => redisClient.call(...args,)
    })
})
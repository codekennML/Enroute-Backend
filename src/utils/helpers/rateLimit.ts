import { rateLimit } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import redisClient from "../../services/redis"

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 100,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        //@ts-expect-error the call function isnt present in ioredis 
        sendCommand: (...args: string[]) => redisClient.call(...args,)
    })

})

// export const otpLimiter  =  rateLimit({ 
//     windowMs: 5 * 60 * 100,
//     limit: 3,
//     standardHeaders: true,
//     legacyHeaders: false, 
//     store : new RedisStore({ 
//         //@ts-expect-error the call function isnt present in ioredis 
//         sendCommand : (...args: string[] ) => redisClient.call(...args,)
//     })
// })

export const otpLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 5 minute
    max: 3, // 3 requests per 5 minutes
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use the user's ID as the rate limit key
        return `otp:${req.body.user}`;
    },
    store: new RedisStore({
        //@ts-expect-error the call function isnt present in ioredis 
        sendCommand: (...args: string[]) => redisClient.call(...args,)
    })

});

export const dailyOtpLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 30, // 10 requests per day
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `otp:daily:${req.body.user}`,
    store: new RedisStore({
        //@ts-expect-error the call function isnt present in ioredis 
        sendCommand: (...args: string[]) => redisClient.call(...args,)
    })
});
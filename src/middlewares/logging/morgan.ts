import morgan from 'morgan';
import rtracer from 'cls-rtracer';
import { requestLogger } from './logger';

// Morgan to use our custom logger instead of the console.log.

const skip = () => {
    const env = process.env.NODE_ENV || 'development';
    return env !== 'development';
};

const format = '[:requestId] :response-time ms :remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

morgan.token('requestId', () => { return rtracer.id() as string });

// Build the morgan middleware
const morganMiddleware = morgan(
    format,
    {
        stream: {
            write: (message: string) => {
                requestLogger.http(message);
            }
        },
        skip
    }
);

export default morganMiddleware;

import {createClient} from "redis";
import logger from "../utils/logger.js";

const {REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME} = process.env;

const redisClient = createClient({
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
    }
});

export const redisConnection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
}
export const defaultJobOptions = {
    removeOnComplete: true, // cleanup
    removeOnFail: false,
    attempts: 3, // retry 3 times
    backoff: {
        type: 'exponential',
        delay: 5000,
    }
}


redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.on("connect", () => console.log("🔌 Connecting to Redis..."));

redisClient.on("ready", () => console.log("✅ Redis connected successfully!"));

// Wrap connection in async function
async function connectRedis() {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (err) {
        logger.error("Redis connection error:", err);
    }
}

// Call the function immediately
connectRedis();

export default redisClient;

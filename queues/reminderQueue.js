import { Queue } from 'bullmq';
import { defaultJobOptions, redisConnection } from '../config/redis.js';

const reminderQueue = new Queue('reminderQueue', {
    connection: redisConnection,
    defaultJobOptions: defaultJobOptions,
});

export function sendShowTimeReminder(data) {
    const showTime = new Date(data.showTime).getTime();
    const reminderTime = showTime - 30 * 60 * 1000; // 30min before show
    const delay = reminderTime - Date.now();

    if (delay <= 0) {
        console.log('Too late to schedule a reminder!');
        return;
    }

    reminderQueue.add(
        'sendReminder',
        { data },
        { delay }
    );
    console.log(`✅ Reminder scheduled for ${data.name} at ${new Date(reminderTime).toLocaleTimeString()}`);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const corsMiddleware = require('./middleware/corsMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const routes = require('./routes');
const webhookRoute = require('./routes/webhookRoutes.js');
const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use("/api/webhook", webhookRoute);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(loggerMiddleware);
require('./config/redis.js')

require('./workers/emailWorker');
require('./workers/smsWorker');
require('./workers/reminderWorker');


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);



app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.use(errorMiddleware);

module.exports = app;

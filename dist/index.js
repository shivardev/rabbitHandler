"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const callback_api_1 = __importDefault(require("amqplib/callback_api"));
const RABBITMQ_HOST = "127.0.0.1"; // Replace with your RabbitMQ host
const RABBITMQ_PORT = 5672; // Default RabbitMQ port
const RABBITMQ_VHOST = "/"; // Virtual host (usually '/')
const RABBITMQ_USER = "guest"; // Replace with your username
const RABBITMQ_PASSWORD = "guest"; // Replace with your password
const QUEUE_NAME = "job"; // Name of the queue to use
const app = (0, express_1.default)();
// Specify the allowed origins
const allowedOrigins = [
    "https://rabbit.blazingbane.com",
    "http://192.168.1.32:5000",
    "http://192.168.1.6:5000",
    "http://192.168.1.3:5000",
];
app.use(express_1.default.json());
app.set('trust proxy', true);
app.use((0, cors_1.default)({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
}));
app.use(body_parser_1.default.json());
app.get("/", (req, res) => {
    res.send("Hello, World!");
});
app.post("/add_msg", (req, res) => {
    const message = req.body.message;
    console.log(message);
    if (!message) {
        return res.status(400).json({ error: "Missing message in request body" });
    }
    const connectionString = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST}`;
    callback_api_1.default.connect(connectionString, (err, connection) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        connection.createChannel((err, channel) => {
            if (err) {
                connection.close();
                return res.status(500).json({ error: err.message });
            }
            channel.assertQueue(QUEUE_NAME, { durable: true });
            channel.sendToQueue(QUEUE_NAME, Buffer.from(message));
            setTimeout(() => {
                connection.close();
                res.status(201).json({ message: "Message added successfully" });
            }, 500);
        });
    });
});
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const callback_api_1 = __importDefault(require("amqplib/callback_api"));
const axios_1 = __importDefault(require("axios"));
const environments_1 = require("./environments");
const ENV = process.env.NODE_ENV || 'prod';
console.log(ENV);
const enviromentVales = (0, environments_1.getEnvirontment)(ENV);
console.log(enviromentVales);
const RABBITMQ_USER = enviromentVales.RABBITMQ_USER;
const RABBITMQ_PASSWORD = enviromentVales.RABBITMQ_PASSWORD;
const RABBITMQ_HOST = enviromentVales.RABBITMQ_HOST;
const RABBITMQ_PORT = enviromentVales.RABBITMQ_PORT;
const RABBITMQ_VHOST = enviromentVales.RABBITMQ_VHOST;
const RABBITMQ_MANAGEMENT_PORT = enviromentVales.RABBITMQ_MANAGEMENT_PORT;
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
function getQueues() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`http://${RABBITMQ_HOST}:15672/api/queues`, {
                auth: {
                    username: "guest", // Replace with your RabbitMQ username
                    password: "guest", // Replace with your RabbitMQ password
                },
            });
            const queuesArray = [];
            response.data.forEach((queue) => {
                queuesArray.push(queue.name);
            });
            return queuesArray;
        }
        catch (error) {
            console.error("Error fetching queues:", error);
        }
    });
}
app.get("/", (req, res) => {
    res.send("Hello, World!");
});
app.post("/add_msg", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const message = req.body.message;
    console.log(message);
    if (!message) {
        return res.status(400).json({ error: "Missing message in request body" });
    }
    let QUEUE_NAME;
    QUEUE_NAME = JSON.parse(message).queueName;
    const queues = yield getQueues();
    if (queues && !queues.includes(QUEUE_NAME)) {
        return res.status(404).json({ error: `Queue ${QUEUE_NAME} does not exist` });
    }
    const connectionString = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST}`;
    try {
        callback_api_1.default.connect(connectionString, (err, connection) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            connection.createChannel((err, channel) => {
                if (err) {
                    connection.close();
                    return res.status(500).json({ error: err.message });
                }
                channel.checkQueue(QUEUE_NAME, (err, ok) => {
                    if (err) {
                        connection.close();
                        return res
                            .status(404)
                            .json({ error: `Queue ${QUEUE_NAME} does not exist` });
                    }
                    try {
                        channel.sendToQueue(QUEUE_NAME, Buffer.from(message));
                        setTimeout(() => {
                            connection.close();
                            res
                                .status(201)
                                .json({ message: "Message added successfully" });
                        }, 500);
                    }
                    catch (e) {
                        connection.close();
                        return res
                            .status(500)
                            .json({ error: "Failed to send message" });
                    }
                });
            });
        });
    }
    catch (error) {
    }
}));
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

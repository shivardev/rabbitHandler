import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import amqp from "amqplib/callback_api";

const RABBITMQ_HOST = "192.168.1.3"; // Replace with your RabbitMQ host
const RABBITMQ_PORT = 5672; // Default RabbitMQ port
const RABBITMQ_VHOST = "/"; // Virtual host (usually '/')
const RABBITMQ_USER = "guest"; // Replace with your username
const RABBITMQ_PASSWORD = "guest"; // Replace with your password
const app = express();
// Specify the allowed origins
const allowedOrigins = [
  "https://rabbit.blazingbane.com",
  "http://192.168.1.32:5000",
  "http://192.168.1.6:5000",
  "http://192.168.1.3:5000",
];

app.use(express.json());
app.set('trust proxy', true);
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.post("/add_msg", (req: Request, res: Response) => {
  const message: string = req.body.message;
  console.log(message);
  if (!message) {
    return res.status(400).json({ error: "Missing message in request body" });
  }
  const QUEUE_NAME = JSON.parse(message).queueName;
  console.log(QUEUE_NAME);
  const connectionString: string = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST}`;

  amqp.connect(connectionString, (err: Error, connection: amqp.Connection) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    connection.createChannel((err: Error, channel: amqp.Channel) => {
      if (err) {
        connection.close();
        return res.status(500).json({ error: err.message });
      }

      channel.checkQueue(
        QUEUE_NAME,
        (err: Error, ok: amqp.Replies.AssertQueue) => {
          if (err) {
            connection.close();
            return res
              .status(404)
              .json({ error: `Queue ${QUEUE_NAME} does not exist` });
          }

          channel.sendToQueue(QUEUE_NAME, Buffer.from(message));

          setTimeout(() => {
            connection.close();
            res.status(201).json({ message: "Message added successfully" });
          }, 500);
        }
      );
    });
  });
});
const PORT: number = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

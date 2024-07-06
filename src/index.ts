import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import amqp from "amqplib/callback_api";

const RABBITMQ_HOST = "127.0.0.1"; // Replace with your RabbitMQ host
const RABBITMQ_PORT = 5672; // Default RabbitMQ port
const RABBITMQ_VHOST = "/"; // Virtual host (usually '/')
const RABBITMQ_USER = "guest"; // Replace with your username
const RABBITMQ_PASSWORD = "guest"; // Replace with your password
const QUEUE_NAME = "job"; // Name of the queue to use

const app = express();
app.use(cors());
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

      channel.assertQueue(QUEUE_NAME, { durable: true });
      channel.sendToQueue(QUEUE_NAME, Buffer.from(message));

      setTimeout(() => {
        connection.close();
        res.status(201).json({ message: "Message added successfully" });
      }, 500);
    });
  });
});

const PORT: number = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

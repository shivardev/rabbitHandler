export const getEnvirontment = (env: string) => {
  if (env === "prod") {
    return {
      RABBITMQ_HOST: "127.0.0.1",
      RABBITMQ_PORT: 5672,
      RABBITMQ_VHOST: "/",
      RABBITMQ_USER: "guest",
      RABBITMQ_PASSWORD: "guest",
      RABBITMQ_MANAGEMENT_PORT: 15672,
    };
  }
  else {
    return {
      RABBITMQ_HOST: "192.168.1.3",
      RABBITMQ_PORT: 5672,
      RABBITMQ_VHOST: "/",
      RABBITMQ_USER: "guest",
      RABBITMQ_PASSWORD: "guest",
      RABBITMQ_MANAGEMENT_PORT: 15672,
    };
  }
};

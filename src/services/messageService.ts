class Message {
  async handlePubSubMessage(channel: string, message: string): Promise<void> {
    if (channel !== `channel:${process.env.APP_SERVER_ADRESS}`) return;

    const parsedMessage = JSON.parse(message);

    const { topic, ...data } = parsedMessage;
  }
}

const CachePubSubMessageHandler = new Message();

export default CachePubSubMessageHandler;

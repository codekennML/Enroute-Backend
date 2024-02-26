import { Kafka, KafkaConfig } from "kafkajs";
import { kafkaConfigData } from "../../config/kafka";

class KafkaRepository {
  private kafkaClient: Kafka;

  constructor(client: KafkaConfig) {
    this.kafkaClient = new Kafka(client);
  }

  createProducer() {}

  produceMessage() {}

  consumeMessage() {}
}

export const kafkaDataLayer = new KafkaRepository(kafkaConfigData);

export default KafkaRepository;

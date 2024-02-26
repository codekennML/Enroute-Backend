import { scyllaDBClient } from "../../config/connectDB";
import cassandra from "cassandra-driver";

class ScyllaConnect {
  private dataLayer: cassandra.Client;

  constructor(dataLayer: cassandra.Client) {
    this.dataLayer = dataLayer;
  }

  async executeDataQuery(
    query: string,
    params?: cassandra.ArrayOrObject,
    options?: cassandra.QueryOptions
  ) {
    const result = await this.dataLayer.execute(query, params, options);
    return result;
  }

  async shutDataLayerDown() {
    this.dataLayer.shutdown;
  }
}

export const scyllaDataLayer = new ScyllaConnect(scyllaDBClient);

export default ScyllaConnect;

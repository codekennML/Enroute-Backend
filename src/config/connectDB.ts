import mongoose from "mongoose";

const DATABASE_URI = process.env.DATABASE_URI as string;
let retries = 0;

const connectDBWithRetry = async () => {
  const delay = Math.pow(2, retries) * 1000; // Exponential backoff

  try {
    await mongoose.connect(DATABASE_URI);

    mongoose.connection.once("open", () => {
      console.log("Connection Success");
    });

    console.log("MongoDB connected successfully!");
  } catch (error) {
    if (retries < 3) {
      console.log(`Retrying DB connection in ${delay / 1000} seconds...`);
      retries++;
      setTimeout(connectDBWithRetry, delay);
    } else {
      throw new Error("Failed to connect to MongoDB after multiple retries");
    }
  }
};

export async function startDB() {
  try {
    await connectDBWithRetry();
  } catch (error) {
    console.log((error as Error).message);
  }
}

import mongoose from "mongoose";

let retries = 0;

const connectDBWithRetry = async () => {
  const delay = Math.pow(2, retries) * 1000; // Exponential backoff

  try {
    await mongoose.connect(process.env.DATABASE_URI as string);

    mongoose.connection.once("open", () => {
      console.log("Connection Success");
    });
  } catch (error) {
    if (retries < 3) {
      console.log(`Retrying connection in ${delay / 1000} seconds...`);
      retries++;
      setTimeout(connectDBWithRetry, delay);
    } else {
      throw new Error("Failed to connect to MongoDB after multiple retries");
    }
  }

  // console.log("MongoDB connected successfully!");
};

export async function startDB() {
  try {
    await connectDBWithRetry();
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.log((error as Error).message);
  }
}

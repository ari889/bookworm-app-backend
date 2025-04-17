import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database Connected ${conn.connection.host}`);
  } catch (error) {
    console.log("Error connection to database", error);
    process.exit(1);
  }
};

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/models/user.model.js";

dotenv.config();

async function createAdmin() {
    await mongoose.connect(process.env.MONGO_URI);

    const admin = await User.create({
        firstName: "Ademola",
        lastName: "Kayode",
        email: "admin@paygo.com",
        password: "Admin123",
        role: "admin",
        isVerified: true
    });

    console.log("Admin created:", admin.email);
    mongoose.disconnect();
}

createAdmin();
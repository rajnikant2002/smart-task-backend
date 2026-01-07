import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();

const app= express();
// Allow Flutter to make requests to the backend
app.use(cors());
app.use(express.json());

app.get("/",(req,res) => {
    res.send("Backend is Running");
});

app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

});
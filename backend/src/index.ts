import express from "express";
import cors from "cors";
import { router } from "./routes";

const app = express();
const PORT = 3001;

app.use(cors({
  origin: "*",
  allowedHeaders: [
    "Content-Type",
    "X-Payment-Proof",
    "X-Payment-Payer",
    "X-Payment-Link",
  ],
}));
app.use(express.json());
app.use("/api", router);

app.listen(PORT, () => {
  console.log(`PayLink backend corriendo en http://localhost:${PORT}`);
});
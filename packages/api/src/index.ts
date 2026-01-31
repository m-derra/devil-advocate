import express from "express";
import cors from "cors";
import sessionsRouter from "./routes/sessions.js";
import feedbackRouter from "./routes/feedback.js";
import settingsRouter from "./routes/settings.js";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increased for base64 screenshots

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/sessions", sessionsRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`🔥 Devil's Advocate API running on http://localhost:${PORT}`);
});

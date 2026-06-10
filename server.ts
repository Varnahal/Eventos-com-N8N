import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { app } from "./src/api-app";

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // PORT value must be 3000 (standard ingress binding)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Local/Cloud server running on port ${PORT}`);
  });
}

startServer();

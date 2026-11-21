// Vercel Serverless Function — health check
import { healthPayload } from "../lib/http-handler.mjs";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json(healthPayload());
}

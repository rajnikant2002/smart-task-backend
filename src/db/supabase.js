import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    "Missing required environment variable: SUPABASE_URL. Please set it in your .env file."
  );
}

if (!SUPABASE_KEY) {
  throw new Error(
    "Missing required environment variable: SUPABASE_KEY. Please set it in your .env file."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
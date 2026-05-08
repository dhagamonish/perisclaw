import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GEMINI_API_KEY: z.string().default(''),
  GROQ_API_KEY: z.string().default(''),
  DASHBOARD_PORT: z.string().default(process.env.PORT || '3000'),
  AUTHORIZED_USER_NUMBER: z.string().default(''),
  SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3000/oauth2callback'),
  WA_PHONE_NUMBER: z.string().min(1, "WA_PHONE_NUMBER is required"),
});

export const env = envSchema.parse(process.env);

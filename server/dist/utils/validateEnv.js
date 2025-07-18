import { z } from 'zod';
export function validateEnv() {
    const envSchema = z.object({
        PORT: z.string().optional(),
        MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
        CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
        NODE_ENV: z.string().optional(),
    });
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Invalid environment variables:', result.error.format());
        process.exit(1);
    }
}

import { config } from "dotenv";
import path from "path";

// Load environment variables from .env.local for integration tests
config({ path: path.resolve(process.cwd(), ".env.local") });

// Also load from .env as fallback
config({ path: path.resolve(process.cwd(), ".env") });

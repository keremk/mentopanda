import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    casing: "snake_case",
  });

  const db = drizzle(pool);

  try {
    // Run Drizzle migrations
    const migrationsFolder = path.join(__dirname, "migrations", "drizzle");
    await migrate(db, { migrationsFolder });

    // Run custom SQL migrations
    const customMigrationsFolder = path.join(__dirname, "migrations", "custom");
    const appliedMigrationsFile = path.join(
      customMigrationsFolder,
      "applied_migrations.json"
    );

    let appliedMigrations = [];
    if (
      await fs
        .access(appliedMigrationsFile)
        .then(() => true)
        .catch(() => false)
    ) {
      appliedMigrations = JSON.parse(
        await fs.readFile(appliedMigrationsFile, "utf8")
      );
    }

    const files = await fs.readdir(customMigrationsFolder);

    for (const file of files.sort()) {
      if (file.endsWith(".sql") && !appliedMigrations.includes(file)) {
        const filePath = path.join(customMigrationsFolder, file);
        const sql = await fs.readFile(filePath, "utf8");
        await pool.query(sql);
        console.log(`Executed custom migration: ${file}`);
        appliedMigrations.push(file);
      }
    }

    // Update the applied migrations file
    await fs.writeFile(
      appliedMigrationsFile,
      JSON.stringify(appliedMigrations, null, 2)
    );
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations().catch(console.error);

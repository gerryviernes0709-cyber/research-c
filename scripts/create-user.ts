import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

const [, , email, name, password, role = "owner"] = process.argv;

if (!email || !name || !password) {
  console.error('Usage: npx tsx scripts/create-user.ts <email> <name> "<password>" [role]');
  process.exit(1);
}

async function main() {
  const sql = neon(DATABASE_URL!);
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await sql`
    INSERT INTO users (email, name, password_hash, role)
    VALUES (${email}, ${name}, ${passwordHash}, ${role})
    ON CONFLICT (email) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          role = EXCLUDED.role
    RETURNING id, email, name, role;
  `;

  console.log("User ready:");
  console.log(result[0]);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

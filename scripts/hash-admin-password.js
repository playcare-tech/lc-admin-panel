import { pbkdf2Sync, randomBytes } from "node:crypto";
import { stdin, stdout } from "node:process";

const PBKDF2_ITERATIONS = 100000;

function readPassword() {
  const [, , passwordArg] = process.argv;
  if (passwordArg) return passwordArg;

  const chunks = [];
  return new Promise((resolve) => {
    stdin.on("data", (chunk) => chunks.push(chunk));
    stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8").trim()));
  });
}

const password = await readPassword();
if (!password) {
  throw new Error("Pass the admin password as an argument or via stdin.");
}

const salt = randomBytes(16).toString("base64");
const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, "sha256").toString("base64");

stdout.write(`ADMIN_PASSWORD_SALT=${salt}\nADMIN_PASSWORD_HASH=${hash}\n`);

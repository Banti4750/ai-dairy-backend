import {
    randomBytes,
    pbkdf2Sync,
    createCipheriv,
    createDecipheriv,
} from "node:crypto";

import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

function deriveKey(password, salt) {
    return pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
}

export function encryptData(text, password) {
    if (!text || !password) return text;

    const salt = randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return `${salt.toString("hex")}:${iv.toString("hex")}:${encrypted}`;
}

export function decryptData(encryptedText, password) {
    if (!encryptedText || !password) return encryptedText;

    const parts = encryptedText.split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted data format");

    const salt = Buffer.from(parts[0], "hex");
    const iv = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const key = deriveKey(password, salt);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "llmProvider" TEXT NOT NULL DEFAULT 'ollama',
    "llmBaseUrl" TEXT NOT NULL DEFAULT 'http://localhost:11434/v1',
    "llmApiKey" TEXT NOT NULL DEFAULT '',
    "llmModel" TEXT NOT NULL DEFAULT 'llama3.1:8b',
    "gmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "outlookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aristoclesKey" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT 'IN',
    "remindDaysBefore" INTEGER NOT NULL DEFAULT 3,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserSettings" ("currency", "gmailEnabled", "id", "llmApiKey", "llmBaseUrl", "llmModel", "llmProvider", "outlookEnabled", "remindDaysBefore", "smsEnabled", "userId") SELECT "currency", "gmailEnabled", "id", "llmApiKey", "llmBaseUrl", "llmModel", "llmProvider", "outlookEnabled", "remindDaysBefore", "smsEnabled", "userId" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

/*
  Warnings:

  - Added the required column `userName` to the `Wish` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userKey" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wish_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Wish" ("createdAt", "id", "postId", "userKey") SELECT "createdAt", "id", "postId", "userKey" FROM "Wish";
DROP TABLE "Wish";
ALTER TABLE "new_Wish" RENAME TO "Wish";
CREATE INDEX "Wish_postId_idx" ON "Wish"("postId");
CREATE UNIQUE INDEX "Wish_postId_userKey_key" ON "Wish"("postId", "userKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

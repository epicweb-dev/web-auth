-- CreateTable
CREATE TABLE "GitHubConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "GitHubConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubConnection_providerId_key" ON "GitHubConnection"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubConnection_providerId_userId_key" ON "GitHubConnection"("providerId", "userId");

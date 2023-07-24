-- CreateIndex
CREATE INDEX "File_imageId_idx" ON "File"("imageId");

-- CreateIndex
CREATE INDEX "Image_noteId_idx" ON "Image"("noteId");

-- CreateIndex
CREATE INDEX "Image_userId_idx" ON "Image"("userId");

-- CreateIndex
CREATE INDEX "Note_ownerId_idx" ON "Note"("ownerId");

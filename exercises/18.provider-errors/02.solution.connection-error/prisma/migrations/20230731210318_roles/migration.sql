-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "access" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_entity_access_key" ON "Permission"("action", "entity", "access");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");


--------------------------------- Manual Seeding --------------------------

INSERT INTO Permission VALUES('clnf2zvli0000pcou3zzzzome','create','user','own','',1696625465526,1696625465526);
INSERT INTO Permission VALUES('clnf2zvll0001pcouly1310ku','create','user','any','',1696625465529,1696625465529);
INSERT INTO Permission VALUES('clnf2zvll0002pcouka7348re','read','user','own','',1696625465530,1696625465530);
INSERT INTO Permission VALUES('clnf2zvlm0003pcouea4dee51','read','user','any','',1696625465530,1696625465530);
INSERT INTO Permission VALUES('clnf2zvlm0004pcou2guvolx5','update','user','own','',1696625465531,1696625465531);
INSERT INTO Permission VALUES('clnf2zvln0005pcoun78ps5ap','update','user','any','',1696625465531,1696625465531);
INSERT INTO Permission VALUES('clnf2zvlo0006pcouyoptc5jp','delete','user','own','',1696625465532,1696625465532);
INSERT INTO Permission VALUES('clnf2zvlo0007pcouw1yzoyam','delete','user','any','',1696625465533,1696625465533);
INSERT INTO Permission VALUES('clnf2zvlp0008pcou9r0fhbm8','create','note','own','',1696625465533,1696625465533);
INSERT INTO Permission VALUES('clnf2zvlp0009pcouj3qib9q9','create','note','any','',1696625465534,1696625465534);
INSERT INTO Permission VALUES('clnf2zvlq000apcouxnspejs9','read','note','own','',1696625465535,1696625465535);
INSERT INTO Permission VALUES('clnf2zvlr000bpcouf4cg3x72','read','note','any','',1696625465535,1696625465535);
INSERT INTO Permission VALUES('clnf2zvlr000cpcouy1vp6oeg','update','note','own','',1696625465536,1696625465536);
INSERT INTO Permission VALUES('clnf2zvls000dpcouvzwjjzrq','update','note','any','',1696625465536,1696625465536);
INSERT INTO Permission VALUES('clnf2zvls000epcou4ts5ui8f','delete','note','own','',1696625465537,1696625465537);
INSERT INTO Permission VALUES('clnf2zvlt000fpcouk29jbmxn','delete','note','any','',1696625465538,1696625465538);

INSERT INTO Role VALUES('clnf2zvlw000gpcour6dyyuh6','admin','',1696625465540,1696625465540);
INSERT INTO Role VALUES('clnf2zvlx000hpcou5dfrbegs','user','',1696625465542,1696625465542);

INSERT INTO _PermissionToRole VALUES('clnf2zvll0001pcouly1310ku','clnf2zvlw000gpcour6dyyuh6');
INSERT INTO _PermissionToRole VALUES('clnf2zvlm0003pcouea4dee51','clnf2zvlw000gpcour6dyyuh6');
INSERT INTO _PermissionToRole VALUES('clnf2zvln0005pcoun78ps5ap','clnf2zvlw000gpcour6dyyuh6');
INSERT INTO _PermissionToRole VALUES('clnf2zvlo0007pcouw1yzoyam','clnf2zvlw000gpcour6dyyuh6');
INSERT INTO _PermissionToRole VALUES('clnf2zvlp0009pcouj3qib9q9','clnf2zvlw000gpcour6dyyuh6');
INSERT INTO _PermissionToRole VALUES('clnf2zvlr000bpcouf4cg3x72','clnf2zvlw000gpcour6dyyuh6');
INSERT INTO _PermissionToRole VALUES('clnf2zvls000dpcouvzwjjzrq','clnf2zvlw000gpcour6dyyuh6');
INSERT INTO _PermissionToRole VALUES('clnf2zvlt000fpcouk29jbmxn','clnf2zvlw000gpcour6dyyuh6');
INSERT INTO _PermissionToRole VALUES('clnf2zvli0000pcou3zzzzome','clnf2zvlx000hpcou5dfrbegs');
INSERT INTO _PermissionToRole VALUES('clnf2zvll0002pcouka7348re','clnf2zvlx000hpcou5dfrbegs');
INSERT INTO _PermissionToRole VALUES('clnf2zvlm0004pcou2guvolx5','clnf2zvlx000hpcou5dfrbegs');
INSERT INTO _PermissionToRole VALUES('clnf2zvlo0006pcouyoptc5jp','clnf2zvlx000hpcou5dfrbegs');
INSERT INTO _PermissionToRole VALUES('clnf2zvlp0008pcou9r0fhbm8','clnf2zvlx000hpcou5dfrbegs');
INSERT INTO _PermissionToRole VALUES('clnf2zvlq000apcouxnspejs9','clnf2zvlx000hpcou5dfrbegs');
INSERT INTO _PermissionToRole VALUES('clnf2zvlr000cpcouy1vp6oeg','clnf2zvlx000hpcou5dfrbegs');
INSERT INTO _PermissionToRole VALUES('clnf2zvls000epcou4ts5ui8f','clnf2zvlx000hpcou5dfrbegs');

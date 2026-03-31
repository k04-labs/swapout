-- CreateTable
CREATE TABLE "AssessmentAiReport" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "subAdminId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAiReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAiReport_submissionId_key" ON "AssessmentAiReport"("submissionId");

-- CreateIndex
CREATE INDEX "AssessmentAiReport_employeeId_createdAt_idx" ON "AssessmentAiReport"("employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "AssessmentAiReport_subAdminId_createdAt_idx" ON "AssessmentAiReport"("subAdminId", "createdAt");

-- AddForeignKey
ALTER TABLE "AssessmentAiReport" ADD CONSTRAINT "AssessmentAiReport_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssessmentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAiReport" ADD CONSTRAINT "AssessmentAiReport_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAiReport" ADD CONSTRAINT "AssessmentAiReport_subAdminId_fkey" FOREIGN KEY ("subAdminId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[productId,targetDate,companyId,modelId]` on the table `Forecast` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,date,companyId]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Forecast_productId_targetDate_companyId_modelId_key" ON "Forecast"("productId", "targetDate", "companyId", "modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_companyId_key" ON "Product"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_productId_date_companyId_key" ON "Sale"("productId", "date", "companyId");

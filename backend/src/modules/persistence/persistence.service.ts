import fs from 'fs';
import path from 'path';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../logger';
import { PersistDatasetParams, DamDbPayload, GdamDbPayload, RtmDbPayload } from './persistence.types';
import { toDecimal } from '../../utils/prisma-decimal';
import { DamIntervalRecord, GdamIntervalRecord, RtmIntervalRecord } from '../transformation/transformation.types';

export class PersistenceService {
  /**
   * Sole owner of the database transaction boundary for market record insertion.
   * Performs Duplicate Checking, Replacement Validation, Dataset Creation, UploadHistory Creation, and Bulk Insertion.
   */
  public static async persistDataset(params: PersistDatasetParams) {
    const { market, deliveryDate, fileName, records, action } = params;
    const isReplacement = action === 'replace';

    // Pre-flight check: Must have exactly 96 records
    if (records.length !== 96) {
      throw new AppError(`Persistence rejected: Expected exactly 96 records, got ${records.length}`, 400);
    }

    // 1. ACTIVE Dataset Discovery & Replacement Validation
    const oldDatasets = await prisma.dataset.findMany({
      where: {
        market,
        deliveryDate,
        status: 'ACTIVE',
      },
    });

    if (oldDatasets.length > 1) {
      throw new AppError('Operational Error: Multiple ACTIVE datasets exist. Please contact support.', 500);
    }

    let oldDatasetToReplace = null;

    if (oldDatasets.length === 1) {
      if (!isReplacement) {
        logger.warn(`Duplicate Check Failed: Active dataset already exists for ${market} on ${deliveryDate.toISOString()}`);
        throw new AppError('Dataset already exists. Use ?action=replace to overwrite.', 409); 
      }
      oldDatasetToReplace = oldDatasets[0];
      logger.info(`Replacement Workflow Initiated: Replacing Dataset ${oldDatasetToReplace.id}`);
    } else {
      if (isReplacement) {
        logger.warn(`Replacement Failed: No ACTIVE dataset found for ${market} on ${deliveryDate.toISOString()}`);
        throw new AppError('Cannot replace: No ACTIVE dataset found for this market and date.', 404);
      }
    }

    logger.info(`Persistence Started: Bulk inserting ${market} dataset`);

    try {
      // 2. The Single Transaction Boundary
      const transactionResult = await prisma.$transaction(async (tx) => {
        
        // 2a. Update old dataset if replacing
        if (oldDatasetToReplace) {
          await tx.dataset.update({
            where: { id: oldDatasetToReplace.id },
            data: { status: 'REPLACED' },
          });
          logger.info(`Dataset Status Updated: ${oldDatasetToReplace.id} is now REPLACED`);
        }

        // 2b. Create Dataset
        const dataset = await tx.dataset.create({
          data: {
            market,
            deliveryDate,
            fileName,
            status: 'ACTIVE',
          },
        });
        logger.info(`Dataset Created: ${dataset.id} is now ACTIVE`);

        // 2c. Create UploadHistory
        await tx.uploadHistory.create({
          data: {
            datasetId: dataset.id,
            market,
            deliveryDate,
            action: isReplacement ? 'REPLACE' : 'UPLOAD',
          },
        });
        logger.info(`UploadHistory Created: ${isReplacement ? 'REPLACE' : 'UPLOAD'} action for ${dataset.id}`);

        // 2d. Map records to Prisma DB format
        let insertedCount = 0;

        if (market === 'DAM') {
          const dbRecords: DamDbPayload[] = (records as DamIntervalRecord[]).map((r) => ({
            datasetId: dataset.id,
            intervalNumber: r.intervalNumber,
            intervalTime: r.intervalTime,
            purchaseBid: toDecimal(r.purchaseBid),
            sellBid: toDecimal(r.sellBid),
            mcv: toDecimal(r.mcv),
            fsv: toDecimal(r.fsv),
            mcp: toDecimal(r.mcp),
          }));

          const result = await tx.damRecord.createMany({ data: dbRecords });
          insertedCount = result.count;
        } 
        else if (market === 'GDAM') {
          const dbRecords: GdamDbPayload[] = (records as GdamIntervalRecord[]).map((r) => ({
            datasetId: dataset.id,
            intervalNumber: r.intervalNumber,
            intervalTime: r.intervalTime,
            purchaseBid: toDecimal(r.purchaseBid),
            sellBidTotal: toDecimal(r.sellBidTotal),
            sellBidSolar: toDecimal(r.sellBidSolar),
            sellBidNonSolar: toDecimal(r.sellBidNonSolar),
            sellBidHydro: toDecimal(r.sellBidHydro),
            mcvTotal: toDecimal(r.mcvTotal),
            mcvSolar: toDecimal(r.mcvSolar),
            mcvNonSolar: toDecimal(r.mcvNonSolar),
            mcvHydro: toDecimal(r.mcvHydro),
            fsvTotal: toDecimal(r.fsvTotal),
            fsvSolar: toDecimal(r.fsvSolar),
            fsvNonSolar: toDecimal(r.fsvNonSolar),
            fsvHydro: toDecimal(r.fsvHydro),
            mcp: toDecimal(r.mcp),
          }));

          const result = await tx.gdamRecord.createMany({ data: dbRecords });
          insertedCount = result.count;
        }
        else if (market === 'RTM') {
          const dbRecords: RtmDbPayload[] = (records as RtmIntervalRecord[]).map((r) => ({
            datasetId: dataset.id,
            intervalNumber: r.intervalNumber,
            intervalTime: r.intervalTime,
            sessionId: r.sessionId,
            purchaseBid: toDecimal(r.purchaseBid),
            sellBid: toDecimal(r.sellBid),
            mcv: toDecimal(r.mcv),
            fsv: toDecimal(r.fsv),
            mcp: toDecimal(r.mcp),
          }));

          const result = await tx.rtmRecord.createMany({ data: dbRecords });
          insertedCount = result.count;
        }

        // 2e. Post-Insertion Verification
        if (insertedCount !== 96) {
          throw new AppError(`Critical Integrity Error: Expected 96 records, but inserted ${insertedCount}.`, 500);
        }

        return dataset;
      });

      logger.info(`[SUCCESS] Transaction Committed: 96 records persisted securely.`);

      // 3. Post-Transaction Physical File Deletion (Deliverable 8A)
      if (oldDatasetToReplace) {
        const oldFilePath = path.join(process.cwd(), 'uploads', market.toLowerCase(), oldDatasetToReplace.fileName);
        try {
          fs.unlinkSync(oldFilePath);
          logger.info(`Old physical file deleted: ${oldFilePath}`);
        } catch (fileError: any) {
          logger.warn(`Failed to delete replaced physical file. Dataset ID: ${oldDatasetToReplace.id}, Market: ${market}, Date: ${deliveryDate.toISOString()}, Expected Path: ${oldFilePath}, Error: ${fileError.message}`);
        }
      }

      return transactionResult;

    } catch (error: any) {
      logger.error(`Transaction Failed: ${error.message}. Rolling back.`);
      throw new AppError(error.message || 'Failed to save dataset records to database', 500);
    }
  }

  /**
   * Sole owner of the database transaction boundary for dataset deletion.
   * Performs Status Validation, Dataset Soft Deletion, UploadHistory Creation, and Physical File Deletion.
   */
  public static async deleteDataset(datasetId: string) {
    // 1. Dataset Discovery & Status Validation
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId }
    });

    if (!dataset) {
      logger.warn(`Deletion Failed: Dataset ${datasetId} not found`);
      throw new AppError('Dataset not found', 404);
    }

    if (dataset.status === 'DELETED') {
      logger.warn(`Deletion Failed: Dataset ${datasetId} is already deleted`);
      throw new AppError('Dataset is already deleted', 409);
    }

    if (dataset.status === 'REPLACED') {
      logger.warn(`Deletion Failed: Dataset ${datasetId} is replaced and historically frozen`);
      throw new AppError('Cannot delete a REPLACED historical dataset', 409);
    }

    if (dataset.status !== 'ACTIVE') {
      throw new AppError(`Cannot delete dataset with status ${dataset.status}`, 409);
    }

    logger.info(`Deletion Started: Soft deleting dataset ${datasetId}`);

    try {
      // 2. The Single Transaction Boundary
      const transactionResult = await prisma.$transaction(async (tx) => {
        // 2a. Update Dataset Status
        const updatedDataset = await tx.dataset.update({
          where: { id: datasetId },
          data: { status: 'DELETED' },
        });
        logger.info(`Dataset Status Updated: ${updatedDataset.id} is now DELETED`);

        // 2b. Create UploadHistory Audit Trail
        await tx.uploadHistory.create({
          data: {
            datasetId: updatedDataset.id,
            market: updatedDataset.market,
            deliveryDate: updatedDataset.deliveryDate,
            action: 'DELETE',
          },
        });
        logger.info(`UploadHistory Created: DELETE action for ${updatedDataset.id}`);

        return updatedDataset;
      });

      logger.info(`[SUCCESS] Deletion Transaction Committed: Dataset ${datasetId} soft deleted securely.`);

      // 3. Post-Transaction Physical File Deletion
      const oldFilePath = path.join(process.cwd(), 'uploads', transactionResult.market.toLowerCase(), transactionResult.fileName);
      try {
        fs.unlinkSync(oldFilePath);
        logger.info(`Old physical file deleted: ${oldFilePath}`);
      } catch (fileError: any) {
        logger.warn(`Failed to delete replaced physical file. Dataset ID: ${transactionResult.id}, Market: ${transactionResult.market}, Date: ${transactionResult.deliveryDate.toISOString()}, Expected Path: ${oldFilePath}, Error: ${fileError.message}`);
      }

      return transactionResult;

    } catch (error: any) {
      logger.error(`Deletion Transaction Failed: ${error.message}. Rolling back.`);
      throw new AppError(error.message || 'Failed to soft delete dataset', 500);
    }
  }
}

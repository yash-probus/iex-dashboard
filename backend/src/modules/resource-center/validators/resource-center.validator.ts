import { AppError } from '../../../utils/AppError';
import { ResourceType } from '../types/resource-center.types';

// Map of mandatory fields for each resource type based on the DB schema
const REQUIRED_FIELDS: Record<ResourceType, string[]> = {
  'region-state': ['stateName'],
  'discom-list': ['legalName'],
  'ists-charges': ['state'],
  'iex-fees': ['month'],
  'prolt-margin': ['month', 'customerId'],
  'ctu-charges': ['month', 'year', 'pdfUrl'],
  'stu-charges': ['stateCode', 'state', 'month'],
  'state-tariff': ['stateCode', 'month', 'state', 'tod']
};

/**
 * Normalizes empty strings and whitespace to undefined.
 * Throws AppError if required fields are missing.
 * Normalizes state_or_ut to lowercase.
 * Checks for Number.isFinite on all decimal/number fields.
 */
export const validatePayload = (resourceType: ResourceType, payload: any): any => {
  if (!payload || typeof payload !== 'object') {
    throw new AppError('Invalid payload format', 400);
  }

  // Clone payload to mutate
  const data = { ...payload };

  // Remove ID if present to avoid updating/creating primary keys
  delete data.id;

  // 1. Normalize Empty Strings and Trim Whitespace
  // Except for specific enum values, we preserve exact casing.
  for (const key in data) {
    if (typeof data[key] === 'string') {
      const trimmed = data[key].trim();
      data[key] = trimmed === '' ? null : trimmed;
    }
  }

  // 2. Required Fields Validation
  const required = REQUIRED_FIELDS[resourceType] || [];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new AppError(`Validation error: ${field} is required`, 400);
    }
  }

  // 3. Month Validation (1-12 or YYYYMM)
  const monthFields = ['month'];
  for (const field of monthFields) {
    if (data[field] !== undefined && data[field] !== null) {
      const val = parseInt(String(data[field]), 10);
      if (isNaN(val)) {
        throw new AppError(`Validation error: ${field} must be a number`, 400);
      }
      
      const isCyclic = val >= 1 && val <= 12;
      const isYyyyMm = String(val).length === 6 && val >= 200001 && val <= 210012;
      
      if (!isCyclic && !isYyyyMm) {
        throw new AppError(`Validation error: ${field} must be between 1 and 12, or in YYYYMM format`, 400);
      }
      data[field] = val; // Store as integer for DB
    }
  }

  // Date Validation (YYYY-MM-DD from frontend, stored as YYYYMMDD in DB)
  if (data.date !== undefined && data.date !== null) {
    const val = String(data.date);
    // Frontend sends '2026-06-24' or similar
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val) && !/^\d{8}$/.test(val)) {
      throw new AppError(`Validation error: date must be in YYYY-MM-DD or YYYYMMDD format`, 400);
    }
  }

  // 4. Decimal/Number Validation
  const numericFields = [
    'stateCode', 'istsLossPercent', 'exchangeFees', 'exchangeFeesGst',
    'nldcApplicationFees', 'nldcSchedulingFees', 'sldcSchedulingFees', 'otherFixCharges',
    'tradingMargin', 'tradingMarginGst', 'proltMargin', 'proltMarginGst',
    'ctuChargesRsPerKwh', 'dsmChargesRsPerKwh', 'stuChargesRsPerKwh', 'demandCharges',
    'percentFppaCharges', 'additionalCharges', 'crossSubsidy', 'distributionWheelingChargesRsPerKwh',
    'stuLossPercent', 'distributionWheelingLossPercent', 'baseEnergyCharges', 'todRate', 'energyCharges'
  ];

  const percentageFields = ['istsLossPercent', 'stuLossPercent', 'distributionWheelingLossPercent'];

  for (const field of numericFields) {
    if (data[field] !== undefined && data[field] !== null) {
      const val = Number(data[field]);
      if (!Number.isFinite(val)) {
        throw new AppError(`Validation error: ${field} must be a finite number`, 400);
      }
      if (val < 0) {
        throw new AppError(`Validation error: ${field} cannot be negative`, 400);
      }
      if (percentageFields.includes(field) && val > 100) {
        throw new AppError(`Validation error: ${field} cannot exceed 100`, 400);
      }
      data[field] = val; // Store back as number for Prisma
    }
  }

  // 5. Enum Normalization
  if (data.stateOrUt !== undefined && data.stateOrUt !== null) {
    const val = String(data.stateOrUt).toLowerCase();
    if (val !== 'state' && val !== 'ut') {
      throw new AppError(`Validation error: stateOrUt must be 'state' or 'ut'`, 400);
    }
    data.stateOrUt = val; // PostgreSQL expects 'state' or 'ut'
  }

  return data;
};

import { SavingsCalculatorService } from '../savings-calculator.service';
import prismaMock from '../../../config/__mocks__/prisma';

jest.mock('../../../config/prisma', () => {
  return {
    __esModule: true,
    default: require('../../../config/__mocks__/prisma').default,
  };
});

describe('SavingsCalculatorService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateMarketDecision', () => {
    it('should throw an error if entry is not found', async () => {
      (prismaMock as any).savingsCalculatorEntry.findUnique = jest.fn().mockResolvedValue(null);
      (prismaMock as any).savingsCalculatorEntryHistory.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        SavingsCalculatorService.calculateMarketDecision('non-existent-id', 'Jan 2025', 1)
      ).rejects.toThrow('Savings calculator entry not found');
    });

    it('should throw an error if state is not provided', async () => {
      const mockEntry = {
        id: 'test-id',
        clientName: 'Test Client',
        tariffCategory: 'HV-2',
        contractDemandKva: 1000,
      };

      (prismaMock as any).savingsCalculatorEntry.findUnique = jest.fn().mockResolvedValue(mockEntry);
      (prismaMock as any).savingsCalculatorEntryHistory.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        SavingsCalculatorService.calculateMarketDecision('test-id', 'Jan 2025')
      ).rejects.toThrow('State is required to calculate savings. Please edit this entry to select a state.');
    });
  });

  describe('getEntryOrVersion (Internal Helper Logic)', () => {
    it('should fetch from history if version is provided', async () => {
      const mockHistory = {
        id: 'hist-1',
        entryId: 'test-id',
        version: 2,
        tariffCategory: 'HV-1'
      };

      (prismaMock as any).savingsCalculatorEntryHistory.findFirst = jest.fn().mockResolvedValue(mockHistory);
      (prismaMock as any).savingsCalculatorEntry.findUnique = jest.fn().mockResolvedValue(null);

      try {
        await SavingsCalculatorService.calculateSavings('test-id', 'Jan 2025', 2);
      } catch (e) {}
      
      expect((prismaMock as any).savingsCalculatorEntryHistory.findFirst).toHaveBeenCalledWith({
        where: { entryId: 'test-id', version: 2 }
      });
    });
  });
});

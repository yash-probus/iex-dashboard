import axios from 'axios';

export class LandingPriceCalcService {
  /**
   * Proxies the calculation request to the IEX Landed Cost Calculator API.
   * @param query The query parameters containing voltage, state, consumerCategory, etc.
   */
  static async calculate(query: any) {
    const { voltage, state, consumerCategory, todMonth, todSlot, iexPrice } = query;

    // According to the correct API discovered, the endpoint is /api/v1/calculator
    const baseUrl = process.env.IEX_CALCULATOR_API_URL || 'https://www.iexindia.com';
    const endpoint = `${baseUrl}/api/v1/calculator`;

    try {
      const response = await axios.get(endpoint, {
        params: {
          voltage,
          state,
          consumerCategory,
          todMonth,
          todSlot,
          iexPrice
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        }
      });
      
      // Return the payload from IEX API
      return response.data;
    } catch (error: any) {
      console.error('[LandingPriceCalcService] Error fetching from IEX API:', error.message);
      if (error.response) {
         throw new Error(`IEX API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error('Failed to calculate landing price from IEX API');
    }
  }

  static async getConsumerCategories(state: string) {
    const baseUrl = process.env.IEX_CALCULATOR_API_URL || 'https://www.iexindia.com';
    const endpoint = `${baseUrl}/api/v1/calculator/consumer-category`;
    const response = await axios.get(endpoint, {
      params: { state },
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    return response.data;
  }

  static async getVoltages(state: string, consumerCategory: string) {
    const baseUrl = process.env.IEX_CALCULATOR_API_URL || 'https://www.iexindia.com';
    const endpoint = `${baseUrl}/api/v1/calculator/voltage`;
    const response = await axios.get(endpoint, {
      params: { state, consumerCategory },
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    return response.data;
  }

  static async getTodMonths(state: string, consumerCategory: string, voltage: string) {
    const baseUrl = process.env.IEX_CALCULATOR_API_URL || 'https://www.iexindia.com';
    const endpoint = `${baseUrl}/api/v1/calculator/tod-months`;
    const response = await axios.get(endpoint, {
      params: { state, consumerCategory, voltage },
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    return response.data;
  }

  static async getTodSlots(state: string, consumerCategory: string, voltage: string, month: string) {
    const baseUrl = process.env.IEX_CALCULATOR_API_URL || 'https://www.iexindia.com';
    const endpoint = `${baseUrl}/api/v1/calculator/tod-slots`;
    const response = await axios.get(endpoint, {
      params: { state, consumerCategory, voltage, month },
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    return response.data;
  }
}

import axios from 'axios';

export class LandingPriceCalcService {
  /**
   * Proxies the calculation request to the IEX Landed Cost Calculator API.
   * @param query The query parameters containing voltage, state, consumerCategory, etc.
   */
  static async calculate(query: any) {
    const { voltage, state, consumerCategory, todMonth, todSlot, iexPrice } = query;

    // According to the screenshot, the IEX API endpoint is /calculator
    const baseUrl = process.env.IEX_CALCULATOR_API_URL || 'https://www.iexindia.com';
    const endpoint = `${baseUrl}/calculator`;

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
          'Accept': 'application/json, text/x-component',
          // Including RSC header as it appears to be a Next.js App Router endpoint
          'RSC': '1'
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
}

import fetch from 'node-fetch';

interface ConversionResult {
  amount: number;
  rate: number;
}

/**
 * Convert an amount from a specified currency to USD
 * @param amount Amount in the original currency
 * @param currency Currency code
 * @returns The amount converted to USD and the conversion rate
 */
export async function convertToUSD(amount: number, currency: string): Promise<ConversionResult> {
  try {
    // Skip if already USD
    if (currency === 'USD') {
      return { amount, rate: 1 };
    }
    
    // Using a public currency conversion API
    const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data = await response.json();
    
    // Check if the currency exists in the response
    if (data.rates && data.rates[currency]) {
      // Convert from USD to the currency, then inverse for currency to USD
      const rate = 1 / data.rates[currency];
      return {
        amount: amount * rate,
        rate
      };
    } else {
      console.error(`Currency ${currency} not found in exchange rates`);
      // Fallback rates for common currencies
      const fallbackRates: Record<string, number> = {
        'EUR': 1.06,
        'GBP': 1.25,
        'CAD': 0.73,
        'AUD': 0.65,
        'CNY': 0.14,
        'JPY': 0.0067
      };
      
      const rate = fallbackRates[currency] || 1;
      return {
        amount: amount * rate,
        rate
      };
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Fallback rates
    const fallbackRates: Record<string, number> = {
      'EUR': 1.06,
      'GBP': 1.25,
      'CAD': 0.73,
      'AUD': 0.65, 
      'CNY': 0.14,
      'JPY': 0.0067
    };
    
    const rate = fallbackRates[currency] || 1;
    return {
      amount: amount * rate,
      rate
    };
  }
}

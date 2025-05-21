/**
 * Currency conversion utility for poker tournament analysis
 * Uses a simple API for conversion rates
 */

/**
 * Get latest exchange rate from currency to USD
 * @param currency Currency code (e.g., EUR, GBP)
 * @returns Promise with conversion rate to USD
 */
export async function getExchangeRate(currency: string): Promise<number> {
  try {
    // Skip if already USD
    if (currency === 'USD') return 1;
    
    // Using a public currency conversion API
    const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data = await response.json();
    
    // Check if the currency exists in the response
    if (data.rates && data.rates[currency]) {
      // Convert from USD to the currency, then inverse for currency to USD
      return 1 / data.rates[currency];
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
      
      return fallbackRates[currency] || 1;
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
    
    return fallbackRates[currency] || 1;
  }
}

/**
 * Convert an amount from a specified currency to USD
 * @param amount Amount in the original currency
 * @param currency Currency code
 * @returns Promise with the amount converted to USD
 */
export async function convertToUSD(amount: number, currency: string): Promise<{amount: number, rate: number}> {
  try {
    // No conversion needed for USD
    if (currency === 'USD') {
      return { amount, rate: 1 };
    }
    
    const exchangeRate = await getExchangeRate(currency);
    return {
      amount: amount * exchangeRate,
      rate: exchangeRate
    };
  } catch (error) {
    console.error('Error converting to USD:', error);
    return { amount, rate: 1 };
  }
}

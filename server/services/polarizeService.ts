import { PolarizePlayerResponse, SummaryResult, TournamentResult } from '@shared/schema';

const API_BASE_URL = 'https://tracker.polarize.gg/api/v1';

/**
 * Get the current player level and limits from Polarize API
 * @param token JWT token for authentication
 * @returns Player level data
 */
export async function getCurrentPlayerLevel(token: string): Promise<PolarizePlayerResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/players/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to get player level: ${response.status} ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching player level:', error);
    throw error;
  }
}

/**
 * Submit tournament session results to Polarize tracker
 * @param token JWT token for authentication
 * @param summary Summary results
 * @param tournaments Tournament details
 * @returns Session ID from Polarize
 */
export async function submitSessionResults(
  token: string,
  summary: SummaryResult,
  tournaments: TournamentResult[]
): Promise<string> {
  try {
    // Format data for Polarize API
    const sessionData = {
      totalProfit: summary.netProfit,
      normalDeal: summary.normalDeal,
      automaticSale: summary.automaticSale,
      tournaments: tournaments.map(t => ({
        name: t.name,
        category: t.category,
        buyIn: t.buyIn,
        result: t.result,
        normalDeal: t.normalDeal,
        automaticSale: t.automaticSale,
        currencyCode: t.currencyCode,
      }))
    };

    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to submit session: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return data.sessionId;
  } catch (error) {
    console.error('Error submitting session results:', error);
    throw error;
  }
}

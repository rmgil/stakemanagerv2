import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { v4 as uuidv4 } from "uuid";
import { 
  parseTournamentSummary, 
  calculateDistributions 
} from "./services/tournamentParser";
import { 
  getCurrentPlayerLevel, 
  submitSessionResults 
} from "./services/polarizeService";
import { convertToUSD } from "./services/currencyConverter";
import { 
  SummaryResult, 
  TournamentResult, 
  PlayerLevel,
  polarizePlayerResponse,
  tournamentResultSchema,
  summaryResultSchema,
  InsertUploadBatch,
  InsertTournament,
  TournamentCategoryType
} from "@shared/schema";
import { storage } from "./storage";
import { calculateSummary, generateCsv } from "../client/src/lib/calculationUtils";
import { z } from "zod";

// Initial dummy player level for development/testing
const DEFAULT_PLAYER_LEVEL: PlayerLevel = {
  level: "3.1",
  levelProgress: 0.65,
  levelProgressPercentage: 65,
  normalLimit: 22,
  phaseLimit: 11
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for tournament processing
  
  // 1. Get player level from Polarize API
  app.get("/api/player/level", async (req: Request, res: Response) => {
    try {
      // In production, we would get token from request
      const token = req.headers.authorization?.split(" ")[1] || "";
      
      // Try to get player level from Polarize API
      let playerLevel: PlayerLevel;
      
      try {
        if (token) {
          const apiResponse = await getCurrentPlayerLevel(token);
          const parsed = polarizePlayerResponse.parse(apiResponse);
          
          playerLevel = {
            level: parsed.level,
            levelProgress: parsed.progress,
            levelProgressPercentage: parsed.progress * 100,
            normalLimit: parsed.limits.normal,
            phaseLimit: parsed.limits.phase
          };
        } else {
          // Use default for development
          playerLevel = DEFAULT_PLAYER_LEVEL;
        }
      } catch (error) {
        console.error("Error fetching player level from API:", error);
        // Fall back to default
        playerLevel = DEFAULT_PLAYER_LEVEL;
      }
      
      res.json(playerLevel);
    } catch (error) {
      console.error("Error in /api/player/level:", error);
      res.status(500).json({ message: "Failed to get player level" });
    }
  });
  
  // 2. Analyze tournaments
  app.post("/api/tournaments/analyze", async (req: Request, res: Response) => {
    try {
      // Validate request
      const reqBody = z.object({
        tournaments: z.array(tournamentResultSchema)
      }).parse(req.body);
      
      // Get player level
      let playerLevel = DEFAULT_PLAYER_LEVEL;
      try {
        const response = await fetch("/api/player/level");
        if (response.ok) {
          playerLevel = await response.json();
        }
      } catch (error) {
        console.error("Error fetching player level:", error);
      }
      
      // Calculate distributions
      const calculatedTournaments = calculateDistributions(
        reqBody.tournaments,
        playerLevel
      );
      
      // Calculate summary
      const summary = calculateSummary(calculatedTournaments);
      
      // Create a session ID
      const sessionId = uuidv4();
      
      // Store in DB
      const batchData: InsertUploadBatch = {
        id: sessionId,
        userId: 1, // Default user ID
        totalTournaments: summary.totalTournaments,
        netProfit: summary.netProfit,
        normalDeal: summary.normalDeal,
        automaticSale: summary.automaticSale,
        submittedToPolarize: false
      };
      
      // Store the batch
      await storage.createUploadBatch(batchData);
      
      // Store each tournament
      for (const tournament of calculatedTournaments) {
        const tournamentData: InsertTournament = {
          userId: 1,
          name: tournament.name,
          category: tournament.category,
          tournamentId: tournament.tournamentId,
          buyIn: tournament.buyIn,
          buyInOriginal: tournament.buyInOriginal,
          result: tournament.result,
          normalDeal: tournament.normalDeal,
          automaticSale: tournament.automaticSale,
          currencyCode: tournament.currencyCode,
          conversionRate: tournament.conversionRate,
          uploadBatchId: sessionId,
          originalFilename: tournament.originalFilename
        };
        
        await storage.createTournament(tournamentData);
      }
      
      res.json({
        tournaments: calculatedTournaments,
        summary,
        sessionId
      });
    } catch (error) {
      console.error("Error analyzing tournaments:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid tournament data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to analyze tournaments" });
      }
    }
  });
  
  // 3. Submit session to Polarize
  app.post("/api/sessions/:sessionId/submit", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      // Get the session data
      const batch = await storage.getUploadBatchById(sessionId);
      if (!batch) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Don't submit if already submitted
      if (batch.submittedToPolarize) {
        return res.json({ 
          message: "Session already submitted", 
          polarizeSessionId: batch.polarizeSessionId 
        });
      }
      
      // Get tournaments for this batch
      const tournaments = await storage.getTournamentsByBatchId(sessionId);
      
      // Get summary for this batch
      const summary: SummaryResult = {
        totalTournaments: batch.totalTournaments,
        netProfit: batch.netProfit,
        normalDeal: batch.normalDeal,
        automaticSale: batch.automaticSale,
        categories: {
          phaseDay1Count: tournaments.filter(t => t.category === "PHASE_DAY_1").length,
          phaseDay2Count: tournaments.filter(t => t.category === "PHASE_DAY_2_PLUS").length,
          otherCurrencyCount: tournaments.filter(t => t.category === "OTHER_CURRENCY").length,
          otherTournamentsCount: tournaments.filter(t => t.category === "OTHER_TOURNAMENTS").length,
          phaseDay1Percentage: 0,
          phaseDay2Percentage: 0,
          otherCurrencyPercentage: 0,
          otherTournamentsPercentage: 0
        }
      };
      
      // Calculate percentages
      const total = summary.totalTournaments;
      summary.categories.phaseDay1Percentage = (summary.categories.phaseDay1Count / total) * 100;
      summary.categories.phaseDay2Percentage = (summary.categories.phaseDay2Count / total) * 100;
      summary.categories.otherCurrencyPercentage = (summary.categories.otherCurrencyCount / total) * 100;
      summary.categories.otherTournamentsPercentage = (summary.categories.otherTournamentsCount / total) * 100;
      
      // In production, get token from request
      const token = req.headers.authorization?.split(" ")[1] || "";
      
      let polarizeSessionId: string;
      try {
        if (token) {
          // Submit to Polarize API
          polarizeSessionId = await submitSessionResults(token, summary, tournaments);
        } else {
          // For development, mock a session ID
          polarizeSessionId = `polarize-${uuidv4().slice(0, 8)}`;
        }
        
        // Update the batch as submitted
        await storage.updateUploadBatch(sessionId, {
          submittedToPolarize: true,
          polarizeSessionId
        });
        
        res.json({ 
          message: "Session submitted successfully", 
          polarizeSessionId 
        });
      } catch (error) {
        console.error("Error submitting to Polarize:", error);
        res.status(500).json({ message: "Failed to submit to Polarize tracker" });
      }
    } catch (error) {
      console.error("Error submitting session:", error);
      res.status(500).json({ message: "Failed to submit session" });
    }
  });
  
  // 4. Export CSV
  app.get("/api/tournaments/export", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.query;
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      // Get tournaments for this batch
      const tournaments = await storage.getTournamentsByBatchId(sessionId);
      
      if (tournaments.length === 0) {
        return res.status(404).json({ message: "No tournaments found for this session" });
      }
      
      // Generate CSV content
      const csvContent = generateCsv(tournaments);
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=polarize-tournaments-${sessionId}.csv`);
      
      // Send the CSV
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Failed to export tournaments as CSV" });
    }
  });
  
  // 5. Get tournament history
  app.get("/api/tournaments/history", async (req: Request, res: Response) => {
    try {
      // Use userId 1 for now
      const userId = 1;
      
      // Get all batches for this user
      const batches = await storage.getUploadBatchesByUserId(userId);
      
      // Format for the response
      const historyItems = batches.map(batch => ({
        id: batch.id,
        date: new Date(batch.createdAt).toLocaleString(),
        totalTournaments: batch.totalTournaments,
        netProfit: batch.netProfit,
        submittedToPolarize: batch.submittedToPolarize
      }));
      
      res.json(historyItems);
    } catch (error) {
      console.error("Error getting history:", error);
      res.status(500).json({ message: "Failed to get upload history" });
    }
  });
  
  // 6. Get session details
  app.get("/api/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      // Get the batch
      const batch = await storage.getUploadBatchById(sessionId);
      if (!batch) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Get tournaments for this batch
      const tournaments = await storage.getTournamentsByBatchId(sessionId);
      
      // Get summary for this batch
      const summary: SummaryResult = {
        totalTournaments: batch.totalTournaments,
        netProfit: batch.netProfit,
        normalDeal: batch.normalDeal,
        automaticSale: batch.automaticSale,
        categories: {
          phaseDay1Count: tournaments.filter(t => t.category === "PHASE_DAY_1").length,
          phaseDay2Count: tournaments.filter(t => t.category === "PHASE_DAY_2_PLUS").length,
          otherCurrencyCount: tournaments.filter(t => t.category === "OTHER_CURRENCY").length,
          otherTournamentsCount: tournaments.filter(t => t.category === "OTHER_TOURNAMENTS").length,
          phaseDay1Percentage: 0,
          phaseDay2Percentage: 0,
          otherCurrencyPercentage: 0,
          otherTournamentsPercentage: 0
        }
      };
      
      // Calculate percentages
      const total = summary.totalTournaments;
      summary.categories.phaseDay1Percentage = (summary.categories.phaseDay1Count / total) * 100;
      summary.categories.phaseDay2Percentage = (summary.categories.phaseDay2Count / total) * 100;
      summary.categories.otherCurrencyPercentage = (summary.categories.otherCurrencyCount / total) * 100;
      summary.categories.otherTournamentsPercentage = (summary.categories.otherTournamentsCount / total) * 100;
      
      res.json({
        batch,
        tournaments,
        summary
      });
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(500).json({ message: "Failed to get session details" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

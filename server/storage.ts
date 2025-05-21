import { 
  users, type User, type InsertUser,
  tournaments, type Tournament, type InsertTournament,
  uploadBatches, type UploadBatch, type InsertUploadBatch
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tournament methods
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  getTournamentsByBatchId(batchId: string): Promise<Tournament[]>;
  
  // Upload Batch methods
  createUploadBatch(batch: InsertUploadBatch): Promise<UploadBatch>;
  getUploadBatchById(id: string): Promise<UploadBatch | undefined>;
  getUploadBatchesByUserId(userId: number): Promise<UploadBatch[]>;
  updateUploadBatch(id: string, updates: Partial<UploadBatch>): Promise<UploadBatch | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tournaments: Map<number, Tournament>;
  private uploadBatches: Map<string, UploadBatch>;
  private tournamentCurrentId: number;
  private userCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tournaments = new Map();
    this.uploadBatches = new Map();
    this.userCurrentId = 1;
    this.tournamentCurrentId = 1;
    
    // Create a default user for development
    this.createUser({
      username: "default",
      password: "password"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Tournament methods
  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const id = this.tournamentCurrentId++;
    const createdAt = new Date();
    
    // Ensure all required properties have valid values
    const newTournament: Tournament = { 
      ...tournament, 
      id, 
      createdAt,
      tournamentId: tournament.tournamentId || null,
      buyInOriginal: tournament.buyInOriginal || null,
      currencyCode: tournament.currencyCode || 'USD',
      conversionRate: tournament.conversionRate || 1
    };
    
    this.tournaments.set(id, newTournament);
    return newTournament;
  }
  
  async getTournamentsByBatchId(batchId: string): Promise<Tournament[]> {
    return Array.from(this.tournaments.values())
      .filter(tournament => tournament.uploadBatchId === batchId);
  }
  
  // Upload Batch methods
  async createUploadBatch(batch: InsertUploadBatch): Promise<UploadBatch> {
    const createdAt = new Date();
    
    // Ensure all required properties have valid values
    const newBatch: UploadBatch = { 
      ...batch, 
      createdAt,
      submittedToPolarize: batch.submittedToPolarize || false,
      polarizeSessionId: batch.polarizeSessionId || null
    };
    
    this.uploadBatches.set(batch.id, newBatch);
    return newBatch;
  }
  
  async getUploadBatchById(id: string): Promise<UploadBatch | undefined> {
    return this.uploadBatches.get(id);
  }
  
  async getUploadBatchesByUserId(userId: number): Promise<UploadBatch[]> {
    return Array.from(this.uploadBatches.values())
      .filter(batch => batch.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt ? b.createdAt.getTime() : 0;
        return dateB - dateA;
      }); // Most recent first
  }
  
  async updateUploadBatch(id: string, updates: Partial<UploadBatch>): Promise<UploadBatch | undefined> {
    const batch = this.uploadBatches.get(id);
    if (!batch) return undefined;
    
    const updatedBatch = { ...batch, ...updates };
    this.uploadBatches.set(id, updatedBatch);
    return updatedBatch;
  }
}

export const storage = new MemStorage();

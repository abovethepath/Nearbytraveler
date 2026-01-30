import { storage } from './storage';

interface AIEvent {
  title: string;
  description: string;
  category: string;
  location: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  date: string;
  endDate?: string;
  tags: string[];
  isPublic: boolean;
  maxParticipants?: number;
}

export class AIEventGenerator {
  /**
   * Generate authentic local events for a specific city using AI
   */
  async generateEventsForLocation(
    city: string, 
    state: string = '', 
    country: string = '', 
    count: number = 3
  ): Promise<AIEvent[]> {
    // DISABLED: Do not generate any fake events
    console.log(`⚠️ AI EVENT GENERATION DISABLED - refusing to create fake events for ${city}`);
    return [];
  }

  /**
   * Generate a random future date within the next 3 weeks
   */
  private getRandomFutureDate(): string {
    const now = new Date();
    const futureDate = new Date(now.getTime() + Math.random() * (21 * 24 * 60 * 60 * 1000)); // 3 weeks
    return futureDate.toISOString().split('T')[0];
  }

  /**
   * DISABLED: AI event generation - Events must be user-created or from legitimate API sources
   * NEVER create events claiming users as organizers
   */
  async ensureEventsForLocation(city: string, state: string = '', country: string = ''): Promise<void> {
    // DISABLED: Do not create any AI-generated events
    // This was creating fake events claiming users as organizers, which is unacceptable
    console.log(`⚠️ AI EVENT GENERATION DISABLED for safety - no fake events will be created for ${city}`);
    return;
  }
}

export const aiEventGenerator = new AIEventGenerator();
import { ChildData, TherapyResponse } from '../types';

export interface ChildScreeningData {
  id: string;
  childName: string;
  age: number;
  eyeContact: string;
  speechLevel: string;
  socialResponse: string;
  sensoryReactions: string;
  geminiResults: TherapyResponse;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export class StorageService {
  private apiUrl: string;
  private apiKey: string;
  private isConfigured: boolean;

  constructor() {
    this.apiUrl = process.env.STORAGE_API_URL || '';
    this.apiKey = process.env.STORAGE_API_KEY || '';
    this.isConfigured = !!(this.apiUrl && this.apiKey);
    
    if (this.isConfigured) {
      console.log('✅ External storage service configured');
    } else {
      console.log('⚠️  External storage not configured - using local memory only');
    }
  }

  async saveScreeningData(childData: ChildData, geminiResults: TherapyResponse): Promise<ChildScreeningData | null> {
    if (!this.isConfigured) {
      console.log('📦 Storage: API not configured, skipping external save');
      return null;
    }

    try {
      const screeningData: Omit<ChildScreeningData, 'id' | 'createdAt' | 'updatedAt'> = {
        childName: childData.childName,
        age: childData.age,
        eyeContact: childData.eyeContact.toString(),
        speechLevel: childData.speechLevel.toString(),
        socialResponse: childData.socialResponse.toString(),
        sensoryReactions: childData.sensoryReactions.toString(),
        geminiResults: geminiResults,
        source: 'gemini-ai'
      };

      console.log('🌐 Saving screening data to external storage...');
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(screeningData)
      });

      if (!response.ok) {
        throw new Error(`Storage API error: ${response.status} ${response.statusText}`);
      }

      const savedData = await response.json() as ChildScreeningData;
      console.log(`✅ Screening data saved to external storage with ID: ${savedData.id || 'unknown'}`);
      
      return savedData;
    } catch (error) {
      console.error('❌ Failed to save to external storage:', error);
      // Don't throw error - continue with local storage
      return null;
    }
  }

  async getScreenings(limit: number = 50, childName?: string): Promise<ChildScreeningData[]> {
    if (!this.isConfigured) {
      console.log('📦 Storage: API not configured, returning empty results');
      return [];
    }

    try {
      let url = `${this.apiUrl}?limit=${limit}`;
      if (childName) {
        url += `&childName=${encodeURIComponent(childName)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Storage API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.screenings || data.data || [];
    } catch (error) {
      console.error('❌ Failed to fetch from external storage:', error);
      return [];
    }
  }

  async getScreeningById(id: string): Promise<ChildScreeningData | null> {
    if (!this.isConfigured) {
      console.log('📦 Storage: API not configured, returning null');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Storage API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.screening || data.data || data;
    } catch (error) {
      console.error('❌ Failed to fetch screening from external storage:', error);
      return null;
    }
  }

  isStorageConfigured(): boolean {
    return this.isConfigured;
  }
}
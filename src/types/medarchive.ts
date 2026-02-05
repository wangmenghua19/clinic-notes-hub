 // MedArchive Types
 
 export type FileType = 'image' | 'audio' | 'video' | 'document';

// Allow any string for dynamic categories
export type DiseaseTag = string;

export type ResearchGroup = string;

export interface CategoryNode {
  id: string;
  name: string;
  type: 'group' | 'tag';
  count: number;
  children?: CategoryNode[];
}

 export interface MedFile {
   id: string;
   name: string;
   type: FileType;
   diseaseTag: DiseaseTag;
   size: number;
   createdAt: Date;
   thumbnailUrl?: string;
   fileUrl: string;
   duration?: number; // For audio files, in seconds
  notes?: string;
  researchGroup?: ResearchGroup;
 }
 
 export interface ShareLink {
   id: string;
   fileId: string;
   expiryType: 'long-term' | '24h';
   createdAt: Date;
   expiresAt?: Date;
   accessCount: number;
   url: string;
 }
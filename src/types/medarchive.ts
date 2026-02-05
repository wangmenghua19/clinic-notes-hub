 // MedArchive Types
 
 export type FileType = 'image' | 'audio' | 'document';
 
 export type DiseaseTag = 
   | '正畸'
   | '植牙'
   | '根管治疗'
   | '牙周病'
   | '儿童齿科'
   | '美白'
   | '修复'
   | '其他';
 
export type ResearchGroup = 
  | '口腔正畸科'
  | '口腔种植科'
  | '牙体牙髓科'
  | '牙周病科'
  | '儿童口腔科'
  | '口腔修复科'
  | '口腔颌面外科';

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
   expiryType: 'burn' | '24h';
   createdAt: Date;
   expiresAt?: Date;
   accessCount: number;
   url: string;
 }
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
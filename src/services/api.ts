 // API Service Layer - Ready for FastAPI backend integration
 
 import { MedFile, ShareLink, FileType, DiseaseTag } from '@/types/medarchive';
 
 // Base API configuration - update when connecting to FastAPI
 const API_BASE_URL = '/api';
 
 // Mock data for demo
 const mockFiles: MedFile[] = [
   {
     id: '1',
     name: '患者张某_术前正畸照片.jpg',
     type: 'image',
     diseaseTag: '正畸',
     size: 2500000,
     createdAt: new Date('2024-01-15'),
     thumbnailUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop',
     fileUrl: '#',
   },
   {
     id: '2',
     name: '种植手术操作录音.mp3',
     type: 'audio',
     diseaseTag: '植牙',
     size: 8500000,
     createdAt: new Date('2024-01-14'),
     fileUrl: '#',
     duration: 245,
   },
   {
     id: '3',
     name: '2024牙周病治疗指南.pdf',
     type: 'document',
     diseaseTag: '牙周病',
     size: 15000000,
     createdAt: new Date('2024-01-13'),
     fileUrl: '#',
   },
   {
     id: '4',
     name: '儿童龋齿预防方案图.jpg',
     type: 'image',
     diseaseTag: '儿童齿科',
     size: 1800000,
     createdAt: new Date('2024-01-12'),
     thumbnailUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=500&fit=crop',
     fileUrl: '#',
   },
   {
     id: '5',
     name: '根管治疗术后X光.jpg',
     type: 'image',
     diseaseTag: '根管治疗',
     size: 3200000,
     createdAt: new Date('2024-01-11'),
     thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=350&fit=crop',
     fileUrl: '#',
   },
   {
     id: '6',
     name: '美白案例对比分析.pdf',
     type: 'document',
     diseaseTag: '美白',
     size: 5600000,
     createdAt: new Date('2024-01-10'),
     fileUrl: '#',
   },
 ];
 
 // API Methods
 export const fileService = {
   // Get all files with optional search
   async getFiles(search?: string, tag?: DiseaseTag): Promise<MedFile[]> {
     // TODO: Replace with actual API call
     // return fetch(`${API_BASE_URL}/files?search=${search}&tag=${tag}`).then(r => r.json());
     
     let files = [...mockFiles];
     if (search) {
       const searchLower = search.toLowerCase();
       files = files.filter(f => 
         f.name.toLowerCase().includes(searchLower) ||
         f.diseaseTag.toLowerCase().includes(searchLower)
       );
     }
     if (tag) {
       files = files.filter(f => f.diseaseTag === tag);
     }
     return Promise.resolve(files);
   },
 
   // Upload a new file
   async uploadFile(
     file: File,
     type: FileType,
     diseaseTag: DiseaseTag
   ): Promise<MedFile> {
     // TODO: Replace with actual API call
     // const formData = new FormData();
     // formData.append('file', file);
     // formData.append('type', type);
     // formData.append('diseaseTag', diseaseTag);
     // return fetch(`${API_BASE_URL}/files`, { method: 'POST', body: formData }).then(r => r.json());
     
     const newFile: MedFile = {
       id: Date.now().toString(),
       name: file.name,
       type,
       diseaseTag,
       size: file.size,
       createdAt: new Date(),
       fileUrl: URL.createObjectURL(file),
       thumbnailUrl: type === 'image' ? URL.createObjectURL(file) : undefined,
     };
     mockFiles.unshift(newFile);
     return Promise.resolve(newFile);
   },
 
   // Delete a file
   async deleteFile(id: string): Promise<void> {
     // TODO: Replace with actual API call
     // return fetch(`${API_BASE_URL}/files/${id}`, { method: 'DELETE' });
     
     const index = mockFiles.findIndex(f => f.id === id);
     if (index > -1) mockFiles.splice(index, 1);
     return Promise.resolve();
   },
 };
 
 export const shareService = {
   // Create a share link
   async createShareLink(
     fileId: string,
     expiryType: 'burn' | '24h'
   ): Promise<ShareLink> {
     // TODO: Replace with actual API call
     // return fetch(`${API_BASE_URL}/shares`, {
     //   method: 'POST',
     //   body: JSON.stringify({ fileId, expiryType })
     // }).then(r => r.json());
     
     const shareLink: ShareLink = {
       id: Date.now().toString(),
       fileId,
       expiryType,
       createdAt: new Date(),
       expiresAt: expiryType === '24h' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
       accessCount: 0,
       url: `${window.location.origin}/share/${Date.now().toString(36)}`,
     };
     return Promise.resolve(shareLink);
   },
 };
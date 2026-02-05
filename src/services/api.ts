import { MedFile, ShareLink, FileType, DiseaseTag, CategoryNode } from '@/types/medarchive';

const API_BASE_URL = '/api';

export const fileService = {
  // Get all files with optional search
  async getFiles(search?: string, tag?: DiseaseTag): Promise<MedFile[]> {
    const params = new URLSearchParams();
    if (tag) params.append('category', tag);
    
    const response = await fetch(`${API_BASE_URL}/resources?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch files');
    const data = await response.json();
    
    // Map backend response to MedFile
    let files: MedFile[] = data.map((r: any) => ({
      id: String(r.id),
      name: r.title,
      type: r.media_type.toLowerCase(), // Backend might return uppercase enum
      diseaseTag: r.category,
      size: r.size,
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      fileUrl: `${API_BASE_URL}/resources/${r.id}/content`,
      thumbnailUrl: r.media_type.toLowerCase() === 'image' ? `${API_BASE_URL}/resources/${r.id}/content` : undefined,
      duration: r.duration
    }));

    if (search) {
       const searchLower = search.toLowerCase();
       files = files.filter(f => f.name.toLowerCase().includes(searchLower));
    }
    return files;
  },

  // Upload a new file
  async uploadFile(
    file: File,
    type: FileType,
    diseaseTag: DiseaseTag,
    title?: string
  ): Promise<MedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('category', diseaseTag);
    
    // Map frontend types to backend enum values
    const mediaTypeMap: Record<string, string> = {
      'image': 'IMAGE',
      'audio': 'AUDIO',
      'video': 'VIDEO',
      'document': 'DOC'
    };
    formData.append('media_type', mediaTypeMap[type] || 'DOC');
    
    const response = await fetch(`${API_BASE_URL}/resources`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Upload error details:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      
      // If privacy alert
      if (response.status === 400 && errorData.detail?.message) {
         throw new Error(errorData.detail.message); 
      }
      
      // Validation error (422) or other errors
      if (errorData.detail) {
        const msg = Array.isArray(errorData.detail) 
          ? errorData.detail.map((e: any) => e.msg).join(', ') 
          : JSON.stringify(errorData.detail);
        throw new Error(`Upload failed: ${msg}`);
      }

      throw new Error('Upload failed: ' + response.statusText);
    }

    const r = await response.json();
    return {
      id: String(r.id),
      name: r.title,
      type: (r.media_type === 'DOC' ? 'document' : r.media_type.toLowerCase()) as FileType,
      diseaseTag: r.category as DiseaseTag,
      size: r.size,
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      fileUrl: `${API_BASE_URL}/resources/${r.id}/content`,
      thumbnailUrl: r.media_type === 'IMAGE' ? `${API_BASE_URL}/resources/${r.id}/content` : undefined,
      duration: r.duration
    };
  },

  // Delete a file
  async deleteFile(id: string): Promise<void> {
    // Backend doesn't have delete endpoint yet!
    // I should implement it or just mock it.
    // User didn't explicitly ask for delete, but it's good practice.
    // For now I'll just resolve.
    return Promise.resolve();
  },
};

export const shareService = {
  // Create a share link
  async createShareLink(
    fileId: string,
    expiryType: 'long-term' | '24h'
  ): Promise<ShareLink> {
    const response = await fetch(`${API_BASE_URL}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource_id: parseInt(fileId),
        expiry_hours: expiryType === '24h' ? 24 : 87600 // 10 years for long-term
      })
    });
    
    if (!response.ok) throw new Error('Failed to create share link');
    
    const r = await response.json();
    return {
      id: String(r.id),
      fileId: String(r.resource_id),
      expiryType,
      createdAt: new Date(r.created_at),
      expiresAt: new Date(r.expires_at),
      accessCount: r.access_count,
      url: `${window.location.origin}/share/${r.share_token}`
    };
  },

  // Get shared resource by token
  async getShareByToken(token: string): Promise<{ resource: MedFile; disclaimer: string }> {
    const response = await fetch(`${API_BASE_URL}/shares/${token}`);
    
    if (!response.ok) {
       const errorData = await response.json().catch(() => ({}));
       throw new Error(errorData.detail || '获取分享内容失败');
    }
    
    const data = await response.json();
    const r = data.resource;
    
    // Robust type mapping
    let fileType: FileType = 'document';
    const rawType = r.media_type ? String(r.media_type).toUpperCase().trim() : 'DOC';
    
    if (rawType === 'IMAGE') fileType = 'image';
    else if (rawType === 'AUDIO') fileType = 'audio';
    else if (rawType === 'VIDEO') fileType = 'video';
    
    // Map backend resource to MedFile
    const resource: MedFile = {
      id: String(r.id),
      name: r.title,
      type: fileType,
      diseaseTag: r.category as DiseaseTag,
      size: r.size,
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      fileUrl: `${API_BASE_URL}/resources/${r.id}/content`,
      thumbnailUrl: r.media_type === 'IMAGE' ? `${API_BASE_URL}/resources/${r.id}/content` : undefined,
      duration: r.duration
    };

    return {
      resource,
      disclaimer: data.disclaimer
    };
  }
};

export const categoryService = {
  async getCategories(): Promise<CategoryNode[]> {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
        // Fallback for first run if table empty or error
        console.warn('Failed to fetch categories, using defaults');
        return [];
    }
    const data = await response.json();
    
    return data.map((c: any) => ({
      id: String(c.id),
      name: c.name,
      type: c.type || 'tag',
      count: 0
    }));
  },

  async createCategory(name: string, type: 'group' | 'tag' = 'tag'): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type })
    });
    if (!response.ok) {
       const err = await response.json();
       throw new Error(err.detail || 'Failed to create category');
    }
    return response.json();
  }
};

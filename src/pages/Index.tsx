import { useState, useEffect } from 'react';
import { MedFile, DiseaseTag } from '@/types/medarchive';
import { fileService } from '@/services/api';
import { Header } from '@/components/medarchive/Header';
import { SearchBar } from '@/components/medarchive/SearchBar';
import { TagFilter } from '@/components/medarchive/TagFilter';
import { FileCard } from '@/components/medarchive/FileCard';
import { UploadDialog } from '@/components/medarchive/UploadDialog';
import { ShareDialog } from '@/components/medarchive/ShareDialog';
import { EmptyState } from '@/components/medarchive/EmptyState';

const Index = () => {
  const [files, setFiles] = useState<MedFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<DiseaseTag | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MedFile | null>(null);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const data = await fileService.getFiles(searchQuery, selectedTag || undefined);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [searchQuery, selectedTag]);

  const handleShare = (file: MedFile) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onUploadClick={() => setUploadDialogOpen(true)} />
      
      <main className="container max-w-7xl mx-auto px-4 py-6">
        {/* Search Section */}
        <div className="space-y-4 mb-8">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
          />
          <TagFilter 
            selectedTag={selectedTag} 
            onTagSelect={setSelectedTag} 
          />
        </div>

        {/* File Grid */}
        {isLoading ? (
          <div className="masonry-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="masonry-item">
                <div className="bg-card rounded-lg shadow-card overflow-hidden animate-pulse">
                  <div className="h-40 bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : files.length > 0 ? (
          <div className="masonry-grid">
            {files.map((file) => (
              <FileCard 
                key={file.id} 
                file={file} 
                onShare={handleShare}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            isSearching={!!searchQuery || !!selectedTag} 
            onUploadClick={() => setUploadDialogOpen(true)}
          />
        )}
      </main>

      {/* Dialogs */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={loadFiles}
      />
      
      <ShareDialog
        file={selectedFile}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />

      {/* Floating Upload Button (Mobile) */}
      <button
        onClick={() => setUploadDialogOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center sm:hidden touch-target active:scale-95 transition-transform"
        aria-label="上传资料"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>
  );
};

export default Index;

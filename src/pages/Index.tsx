import { useState, useEffect } from 'react';
import { MedFile, DiseaseTag } from '@/types/medarchive';
import { fileService } from '@/services/api';
import { Header } from '@/components/medarchive/Header';
import { CategoryTree } from '@/components/medarchive/CategoryTree';
import { FileGrid } from '@/components/medarchive/FileGrid';
import { DetailPanel } from '@/components/medarchive/DetailPanel';
import { UploadDialog } from '@/components/medarchive/UploadDialog';
import { ShareDialog } from '@/components/medarchive/ShareDialog';
import { cn } from '@/lib/utils';

const Index = () => {
  const [files, setFiles] = useState<MedFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareFile, setShareFile] = useState<MedFile | null>(null);
  
  // Panel states
  const [selectedFile, setSelectedFile] = useState<MedFile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'group' | 'tag'>('all');
  const [filterValue, setFilterValue] = useState<string | undefined>(undefined);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      // Filter based on category selection
      let tagFilter: DiseaseTag | undefined;
      if (filterType === 'tag' && filterValue) {
        tagFilter = filterValue as DiseaseTag;
      }
      const data = await fileService.getFiles(searchQuery, tagFilter);
      setFiles(data);
      if (selectedFile) {
        const updated = data.find(f => f.id === selectedFile.id);
        if (updated) {
          setSelectedFile(updated);
        }
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [searchQuery, filterType, filterValue]);

  useEffect(() => {
    const handler = () => loadFiles();
    window.addEventListener('medarchive:categories-updated', handler as EventListener);
    return () => {
      window.removeEventListener('medarchive:categories-updated', handler as EventListener);
    };
  }, []);

  const handleCategorySelect = (category: string | null, type: 'all' | 'group' | 'tag', value?: string) => {
    setSelectedCategory(category);
    setFilterType(type);
    setFilterValue(value);
    // Close sidebar on mobile after selection
    setSidebarOpen(false);
  };

  const handleFileSelect = (file: MedFile) => {
    setSelectedFile(file);
  };

  const handleShare = (file: MedFile) => {
    setShareFile(file);
    setShareDialogOpen(true);
  };

  const handleDelete = async (file: MedFile) => {
    try {
      await fileService.deleteFile(file.id);
      setFiles(prev => prev.filter(f => f.id !== file.id));
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header 
        onUploadClick={() => setUploadDialogOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Category Tree */}
        <aside 
          className={cn(
            'w-64 border-r bg-card flex-shrink-0 transition-transform duration-200',
            'fixed lg:relative inset-y-0 left-0 z-40 lg:z-0 pt-16 lg:pt-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <CategoryTree 
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Center - File Grid */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <FileGrid
            files={files}
            isLoading={isLoading}
            isSearching={!!searchQuery || filterType !== 'all'}
            selectedFileId={selectedFile?.id || null}
            onFileSelect={handleFileSelect}
            onShare={handleShare}
            onUploadClick={() => setUploadDialogOpen(true)}
          />
        </main>

        {/* Right Panel - Detail View */}
        <aside 
          className={cn(
            'w-80 border-l bg-card flex-shrink-0 transition-all duration-200 overflow-hidden',
            'hidden xl:block',
            selectedFile ? 'xl:w-80' : 'xl:w-0 xl:border-l-0'
          )}
        >
          <DetailPanel 
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onShare={handleShare}
            onDelete={handleDelete}
          />
        </aside>
      </div>

      {/* Mobile Detail Panel - Modal */}
      {selectedFile && (
        <div className="xl:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedFile(null)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-card shadow-modal">
            <DetailPanel 
              file={selectedFile}
              onClose={() => setSelectedFile(null)}
              onShare={handleShare}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={loadFiles}
      />
      
      <ShareDialog
        file={shareFile}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />

      {/* Floating Upload Button (Mobile) */}
      <button
        onClick={() => setUploadDialogOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center lg:hidden touch-target active:scale-95 transition-transform z-20"
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

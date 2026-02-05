 import { MedFile } from '@/types/medarchive';
 import { FileCard } from './FileCard';
 import { EmptyState } from './EmptyState';
 
 interface FileGridProps {
   files: MedFile[];
   isLoading: boolean;
   isSearching: boolean;
   selectedFileId: string | null;
   onFileSelect: (file: MedFile) => void;
   onShare: (file: MedFile) => void;
   onUploadClick: () => void;
 }
 
 export function FileGrid({
   files,
   isLoading,
   isSearching,
   selectedFileId,
   onFileSelect,
   onShare,
   onUploadClick,
 }: FileGridProps) {
   if (isLoading) {
     return (
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
     );
   }
 
   if (files.length === 0) {
     return <EmptyState isSearching={isSearching} onUploadClick={onUploadClick} />;
   }
 
   return (
     <div className="masonry-grid">
       {files.map((file) => (
         <FileCard
           key={file.id}
           file={file}
           isSelected={selectedFileId === file.id}
           onSelect={() => onFileSelect(file)}
           onShare={onShare}
         />
       ))}
     </div>
   );
 }
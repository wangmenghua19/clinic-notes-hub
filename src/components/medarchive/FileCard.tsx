 import { Image, FileAudio, FileText, Share2, Play, Pause } from 'lucide-react';
 import { useState } from 'react';
 import { MedFile } from '@/types/medarchive';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Progress } from '@/components/ui/progress';
 import { cn } from '@/lib/utils';
 
 interface FileCardProps {
   file: MedFile;
  isSelected?: boolean;
  onSelect?: () => void;
   onShare: (file: MedFile) => void;
 }
 
export function FileCard({ file, isSelected, onSelect, onShare }: FileCardProps) {
   const [isPlaying, setIsPlaying] = useState(false);
   const [audioProgress, setAudioProgress] = useState(0);
 
   const formatSize = (bytes: number) => {
     if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
     return `${(bytes / 1000).toFixed(0)} KB`;
   };
 
   const formatDuration = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins}:${secs.toString().padStart(2, '0')}`;
   };
 
   const formatDate = (date: Date) => {
     return new Intl.DateTimeFormat('zh-CN', {
       month: 'short',
       day: 'numeric',
     }).format(date);
   };
 
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
     setIsPlaying(!isPlaying);
     // Simulate audio playback progress
     if (!isPlaying) {
       const interval = setInterval(() => {
         setAudioProgress(prev => {
           if (prev >= 100) {
             clearInterval(interval);
             setIsPlaying(false);
             return 0;
           }
           return prev + 2;
         });
       }, 100);
     }
   };
 
   return (
     <div className="masonry-item">
      <div 
        onClick={onSelect}
        className={cn(
          'group bg-card rounded-lg shadow-card overflow-hidden hover:shadow-elevated transition-all duration-200 cursor-pointer',
          isSelected && 'ring-2 ring-primary shadow-elevated'
        )}
      >
         {/* Preview Area */}
         <div className="relative watermark">
           {file.type === 'image' && file.thumbnailUrl && (
             <img
               src={file.thumbnailUrl}
               alt={file.name}
               className="w-full object-cover"
               style={{ maxHeight: '280px' }}
             />
           )}
           
           {file.type === 'audio' && (
             <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
               <div className="flex items-center gap-4">
                 <Button
                   size="icon"
                   variant="default"
                   className="h-14 w-14 rounded-full touch-target"
                   onClick={togglePlay}
                 >
                   {isPlaying ? (
                     <Pause className="h-6 w-6" />
                   ) : (
                     <Play className="h-6 w-6 ml-1" />
                   )}
                 </Button>
                 <div className="flex-1">
                   <Progress value={audioProgress} className="h-2" />
                   <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                     <span>{formatDuration(Math.floor((audioProgress / 100) * (file.duration || 0)))}</span>
                     <span>{file.duration ? formatDuration(file.duration) : '--:--'}</span>
                   </div>
                 </div>
               </div>
             </div>
           )}
           
           {file.type === 'document' && (
             <div className="bg-gradient-to-br from-destructive/5 to-warning/5 p-8 flex items-center justify-center">
               <div className="text-center">
                 <FileText className="h-16 w-16 mx-auto text-destructive/60" />
                 <span className="text-sm text-muted-foreground mt-2 block">PDF 文档</span>
               </div>
             </div>
           )}
 
           {/* Share button overlay */}
           <Button
             size="icon"
             variant="secondary"
             className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 shadow-elevated"
            onClick={(e) => {
              e.stopPropagation();
              onShare(file);
            }}
           >
             <Share2 className="h-4 w-4" />
           </Button>
         </div>
 
         {/* Info Area */}
         <div className="p-4">
           <div className="flex items-start justify-between gap-2 mb-2">
             <h3 className="font-medium text-sm leading-tight line-clamp-2">{file.name}</h3>
             {file.type === 'image' && <Image className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
             {file.type === 'audio' && <FileAudio className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
             {file.type === 'document' && <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
           </div>
           
           <div className="flex items-center justify-between">
             <Badge variant="secondary" className="text-xs font-normal">
               {file.diseaseTag}
             </Badge>
             <span className="text-xs text-muted-foreground">
               {formatSize(file.size)} · {formatDate(file.createdAt)}
             </span>
           </div>
         </div>
       </div>
     </div>
   );
 }
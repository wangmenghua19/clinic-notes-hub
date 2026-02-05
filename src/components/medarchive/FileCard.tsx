 import { Image, FileAudio, FileText, Share2, Play, Pause, FileVideo, Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { MedFile } from '@/types/medarchive';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
   const [videoOpen, setVideoOpen] = useState(false);

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
    <>
    <div className="masonry-item mb-4 break-inside-avoid">
      <div 
        onClick={onSelect}
        className={cn(
          'group relative bg-card rounded-xl border border-border/40 hover:border-border/80 hover:shadow-sm transition-all duration-200 cursor-pointer overflow-hidden',
          isSelected && 'ring-2 ring-primary ring-offset-1 border-transparent'
        )}
      >
        {/* Preview Area */}
        <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden">
          {file.type === 'image' && file.thumbnailUrl ? (
            <img
              src={file.thumbnailUrl}
              alt={file.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : file.type === 'audio' ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50/50 p-4">
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full bg-white/80 shadow-sm hover:bg-white text-amber-600 mb-2"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
              <span className="text-xs font-medium text-amber-700/70">
                {file.duration ? formatDuration(file.duration) : '音频录音'}
              </span>
            </div>
          ) : file.type === 'video' ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900/5 relative group/video">
              <FileVideo className="h-12 w-12 text-slate-400 mb-2" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/video:bg-black/20 transition-colors">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-12 w-12 rounded-full bg-white/90 shadow-sm hover:bg-white text-primary hover:scale-105 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoOpen(true);
                  }}
                >
                  <Play className="h-6 w-6 ml-1 fill-current" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50">
              <FileText className="h-12 w-12 text-slate-300" />
            </div>
          )}

          {/* Overlay Actions (Eagle style) */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             <Button
               size="icon"
               variant="secondary"
               className="h-8 w-8 rounded-lg shadow-sm bg-white/90 hover:bg-white"
               onClick={(e) => {
                 e.stopPropagation();
                 onShare(file);
               }}
             >
               <Share2 className="h-4 w-4 text-muted-foreground" />
             </Button>
          </div>
        </div>

        {/* Content Area (Notion style) */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium text-sm leading-tight line-clamp-2 text-foreground/90">
              {file.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-secondary/50 text-secondary-foreground/70 hover:bg-secondary/70">
              {file.diseaseTag}
            </Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDate(file.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>

    {videoOpen && (
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{file.name}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-video flex items-center justify-center">
            <video 
              src={file.fileUrl} 
              controls 
              autoPlay 
              className="w-full h-full"
              controlsList="nodownload"
            >
              您的浏览器不支持视频播放。
            </video>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}
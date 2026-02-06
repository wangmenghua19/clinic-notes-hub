 import { useState } from 'react';
import { X, Share2, Download, Trash2, Play, Pause, FileText, Save, Edit3 } from 'lucide-react';
 import { MedFile } from '@/types/medarchive';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Textarea } from '@/components/ui/textarea';
 import { Progress } from '@/components/ui/progress';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
 import { cn } from '@/lib/utils';
 
 interface DetailPanelProps {
   file: MedFile | null;
   onClose: () => void;
   onShare: (file: MedFile) => void;
  onDelete: (file: MedFile) => void;
 }
 
export function DetailPanel({ file, onClose, onShare, onDelete }: DetailPanelProps) {
   const [isPlaying, setIsPlaying] = useState(false);
   const [audioProgress, setAudioProgress] = useState(0);
   const [notes, setNotes] = useState(file?.notes || '');
   const [isEditingNotes, setIsEditingNotes] = useState(false);
 
   if (!file) {
     return (
       <div className="h-full flex items-center justify-center p-8 text-center">
         <div>
           <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
             <FileText className="h-8 w-8 text-muted-foreground" />
           </div>
           <p className="text-muted-foreground">选择一个资料查看详情</p>
         </div>
       </div>
     );
   }
 
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
       year: 'numeric',
       month: 'long',
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit',
     }).format(date);
   };
 
   const togglePlay = () => {
     setIsPlaying(!isPlaying);
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
 
   const handleSaveNotes = () => {
     // TODO: Save notes to backend
     setIsEditingNotes(false);
   };
 
   return (
     <div className="h-full flex flex-col bg-card">
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b">
         <h3 className="font-semibold text-lg truncate pr-4">资料详情</h3>
         <Button variant="ghost" size="icon" onClick={onClose}>
           <X className="h-4 w-4" />
         </Button>
       </div>
 
       <ScrollArea className="flex-1">
         <div className="p-4 space-y-6">
           {/* Preview */}
           <div className="rounded-lg overflow-hidden bg-muted watermark">
             {file.type === 'image' && file.thumbnailUrl && (
               <img
                 src={file.thumbnailUrl}
                 alt={file.name}
                 className="w-full object-contain max-h-64"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = 'none';
                }}
               />
             )}
            {file.type === 'image' && !file.thumbnailUrl && (
              <div className="h-40 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="h-14 w-14 rounded-xl bg-primary/90 text-primary-foreground flex items-center justify-center shadow-sm">
                    <FileText className="h-8 w-8" />
                  </div>
                  <span className="mt-2 text-sm font-medium text-foreground/80">学习资料</span>
                </div>
              </div>
            )}
             
             {file.type === 'audio' && (
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="default"
                    className="h-12 w-12 rounded-full"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
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

            {file.type === 'video' && (
              <div className="w-full aspect-video bg-black flex items-center justify-center">
                 <video 
                   src={file.fileUrl} 
                   controls 
                   className="w-full h-full"
                   controlsList="nodownload"
                   onError={(e) => {
                     const el = e.currentTarget as HTMLVideoElement;
                     el.style.display = 'none';
                   }}
                 >
                   您的浏览器不支持视频播放。
                 </video>
              </div>
            )}
            
            {file.type === 'document' && (
              <div className="h-40 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="h-14 w-14 rounded-xl bg-primary/90 text-primary-foreground flex items-center justify-center shadow-sm">
                    <FileText className="h-8 w-8" />
                  </div>
                  <span className="mt-2 text-sm font-medium text-foreground/80">学习资料</span>
                </div>
              </div>
             )}
           </div>
 
           {/* File Info */}
           <div>
             <h4 className="font-medium mb-3 line-clamp-2">{file.name}</h4>
             <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">目录所在</span>
                <Badge variant="secondary">{file.diseaseTag}</Badge>
              </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">文件大小</span>
                 <span>{formatSize(file.size)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">上传时间</span>
                 <span>{formatDate(file.createdAt)}</span>
               </div>
               {file.researchGroup && (
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">教研组</span>
                   <span>{file.researchGroup}</span>
                 </div>
               )}
             </div>
           </div>
 
           <Separator />
 
           {/* Notes Section */}
           <div>
             <div className="flex items-center justify-between mb-3">
               <h4 className="font-medium">笔记</h4>
               {!isEditingNotes ? (
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setIsEditingNotes(true)}
                 >
                   <Edit3 className="h-4 w-4 mr-1" />
                   编辑
                 </Button>
               ) : (
                 <Button
                   variant="default"
                   size="sm"
                   onClick={handleSaveNotes}
                 >
                   <Save className="h-4 w-4 mr-1" />
                   保存
                 </Button>
               )}
             </div>
             
             {isEditingNotes ? (
               <Textarea
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="添加笔记..."
                 className="min-h-[120px] resize-none"
               />
             ) : (
               <div className="min-h-[80px] p-3 rounded-lg bg-muted/50 text-sm">
                 {notes || (
                   <span className="text-muted-foreground italic">暂无笔记</span>
                 )}
               </div>
             )}
           </div>
         </div>
       </ScrollArea>
 
       {/* Actions */}
       <div className="p-4 border-t space-y-2">
         <div className="grid grid-cols-2 gap-2">
           <Button
             variant="default"
             className="h-11 touch-target"
             onClick={() => onShare(file)}
           >
             <Share2 className="h-4 w-4 mr-2" />
             分享
           </Button>
           <Button variant="outline" className="h-11 touch-target">
             <Download className="h-4 w-4 mr-2" />
             下载
           </Button>
         </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除资料
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                删除操作不可逆，删除后文件将永久消失。确定要删除该资料吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => file && onDelete(file)}
              >
                确定删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
       </div>
     </div>
   );
 }

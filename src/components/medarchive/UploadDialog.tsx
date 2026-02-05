 import { useState, useCallback } from 'react';
 import { Upload, X, Image, FileAudio, FileText, Check } from 'lucide-react';
 import { useDropzone } from 'react-dropzone';
 import { FileType, DiseaseTag } from '@/types/medarchive';
 import { fileService } from '@/services/api';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { cn } from '@/lib/utils';
 import { useToast } from '@/hooks/use-toast';
 
 const FILE_TYPES: { value: FileType; label: string; icon: typeof Image }[] = [
   { value: 'image', label: '图片', icon: Image },
   { value: 'audio', label: '录音', icon: FileAudio },
   { value: 'document', label: '文档', icon: FileText },
 ];
 
 const DISEASE_TAGS: DiseaseTag[] = [
   '正畸', '植牙', '根管治疗', '牙周病', '儿童齿科', '美白', '修复', '其他'
 ];
 
 interface UploadDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onUploadComplete: () => void;
 }
 
 export function UploadDialog({ open, onOpenChange, onUploadComplete }: UploadDialogProps) {
   const [file, setFile] = useState<File | null>(null);
   const [fileType, setFileType] = useState<FileType | null>(null);
   const [diseaseTag, setDiseaseTag] = useState<DiseaseTag | null>(null);
   const [isUploading, setIsUploading] = useState(false);
   const { toast } = useToast();
 
   const onDrop = useCallback((acceptedFiles: File[]) => {
     const selectedFile = acceptedFiles[0];
     if (selectedFile) {
       // Check file size (50MB limit)
       if (selectedFile.size > 50 * 1024 * 1024) {
         toast({
           title: '文件过大',
           description: '单个文件最大支持 50MB',
           variant: 'destructive',
         });
         return;
       }
       setFile(selectedFile);
       
       // Auto-detect file type
       if (selectedFile.type.startsWith('image/')) {
         setFileType('image');
       } else if (selectedFile.type.startsWith('audio/')) {
         setFileType('audio');
       } else if (selectedFile.type === 'application/pdf') {
         setFileType('document');
       }
     }
   }, [toast]);
 
   const { getRootProps, getInputProps, isDragActive } = useDropzone({
     onDrop,
     multiple: false,
     accept: {
       'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
       'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
       'application/pdf': ['.pdf'],
     },
   });
 
   const handleUpload = async () => {
     if (!file || !fileType || !diseaseTag) return;
 
     setIsUploading(true);
     try {
       await fileService.uploadFile(file, fileType, diseaseTag);
       toast({
         title: '上传成功',
         description: `${file.name} 已添加到资料库`,
       });
       onUploadComplete();
       handleClose();
     } catch {
       toast({
         title: '上传失败',
         description: '请稍后重试',
         variant: 'destructive',
       });
     } finally {
       setIsUploading(false);
     }
   };
 
   const handleClose = () => {
     setFile(null);
     setFileType(null);
     setDiseaseTag(null);
     onOpenChange(false);
   };
 
   const formatSize = (bytes: number) => {
     if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
     return `${(bytes / 1000).toFixed(0)} KB`;
   };
 
   const canUpload = file && fileType && diseaseTag;
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="sm:max-w-lg">
         <DialogHeader>
           <DialogTitle className="text-xl">上传资料</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-6 pt-4">
           {/* Dropzone */}
           <div
             {...getRootProps()}
             className={cn(
               'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
               isDragActive ? 'border-primary bg-accent' : 'border-muted-foreground/25 hover:border-primary/50',
               file && 'border-success bg-success/5'
             )}
           >
             <input {...getInputProps()} />
             {file ? (
               <div className="flex items-center justify-center gap-3">
                 <Check className="h-6 w-6 text-success" />
                 <div className="text-left">
                   <p className="font-medium">{file.name}</p>
                   <p className="text-sm text-muted-foreground">{formatSize(file.size)}</p>
                 </div>
                 <Button
                   variant="ghost"
                   size="icon"
                   className="ml-2"
                   onClick={(e) => {
                     e.stopPropagation();
                     setFile(null);
                     setFileType(null);
                   }}
                 >
                   <X className="h-4 w-4" />
                 </Button>
               </div>
             ) : (
               <>
                 <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                 <p className="text-muted-foreground">
                   {isDragActive ? '松开以上传文件' : '拖拽文件到此处或点击选择'}
                 </p>
                 <p className="text-xs text-muted-foreground mt-2">
                   支持图片、录音、PDF，最大 50MB
                 </p>
               </>
             )}
           </div>
 
           {/* File Type Selection */}
           <div>
             <label className="text-sm font-medium mb-3 block">
               资料类型 <span className="text-destructive">*</span>
             </label>
             <div className="flex gap-3">
               {FILE_TYPES.map(({ value, label, icon: Icon }) => (
                 <Button
                   key={value}
                   type="button"
                   variant={fileType === value ? 'default' : 'outline'}
                   className="flex-1 h-12 touch-target"
                   onClick={() => setFileType(value)}
                 >
                   <Icon className="h-4 w-4 mr-2" />
                   {label}
                 </Button>
               ))}
             </div>
           </div>
 
           {/* Disease Tag Selection */}
           <div>
             <label className="text-sm font-medium mb-3 block">
               病种标签 <span className="text-destructive">*</span>
             </label>
             <div className="flex flex-wrap gap-2">
               {DISEASE_TAGS.map((tag) => (
                 <Badge
                   key={tag}
                   variant={diseaseTag === tag ? 'default' : 'outline'}
                   className={cn(
                     'cursor-pointer touch-target px-4 py-2 text-sm transition-colors',
                     diseaseTag === tag 
                       ? 'bg-primary text-primary-foreground' 
                       : 'hover:bg-accent'
                   )}
                   onClick={() => setDiseaseTag(tag)}
                 >
                   {tag}
                 </Badge>
               ))}
             </div>
           </div>
 
           {/* Upload Button */}
           <Button
             className="w-full h-12 touch-target text-base"
             disabled={!canUpload || isUploading}
             onClick={handleUpload}
           >
             {isUploading ? (
               <>
                 <span className="animate-pulse-gentle">上传中...</span>
               </>
             ) : (
               <>
                 <Upload className="h-5 w-5 mr-2" />
                 上传资料
               </>
             )}
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }
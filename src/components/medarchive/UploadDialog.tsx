import { useState, useCallback, useEffect } from 'react';
import { Upload, X, Image, FileAudio, FileText, Check, FileVideo, FolderPlus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { FileType, CategoryNode } from '@/types/medarchive';
import { fileService, categoryService } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const FILE_TYPES: { value: FileType; label: string; icon: typeof Image }[] = [
  { value: 'image', label: '图片', icon: Image },
  { value: 'audio', label: '录音', icon: FileAudio },
  { value: 'video', label: '视频', icon: FileVideo },
  { value: 'document', label: '文档', icon: FileText },
];

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

export function UploadDialog({ open, onOpenChange, onUploadComplete }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [title, setTitle] = useState('');
  const [diseaseTag, setDiseaseTag] = useState<string>('');
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      // Check file size (500MB limit)
      if (selectedFile.size > 500 * 1024 * 1024) {
        toast({
          title: '文件过大',
          description: '单个文件最大支持 500MB',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setTitle(selectedFile.name); // Default title
      
      // Auto-detect file type
      if (selectedFile.type.startsWith('image/')) {
        setFileType('image');
      } else if (selectedFile.type.startsWith('audio/')) {
        setFileType('audio');
      } else if (selectedFile.type.startsWith('video/')) {
        setFileType('video');
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
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
      'application/pdf': ['.pdf'],
    },
  });

  const handleUpload = async () => {
    if (!file || !fileType || !diseaseTag || !title) return;

    setIsUploading(true);
    try {
      await fileService.uploadFile(file, fileType, diseaseTag, title);
      toast({
        title: '上传成功',
        description: `${title} 已添加到资料库`,
      });
      setIsUploading(false);
      onUploadComplete();
      handleClose();
    } catch (error: any) {
      setIsUploading(false);
      toast({
        title: '上传失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setFileType(null);
    setTitle('');
    setDiseaseTag('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>上传资料</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors h-64 flex flex-col items-center justify-center gap-4",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input {...getInputProps()} />
              <div className="bg-primary/10 p-4 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">点击或拖拽文件到此处</p>
                <p className="text-xs text-muted-foreground mt-1">支持图片、音频、视频和 PDF 文档</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50">
                <div className="h-12 w-12 bg-white rounded-lg border flex items-center justify-center shrink-0">
                  {fileType === 'image' && <Image className="h-6 w-6 text-blue-500" />}
                  {fileType === 'audio' && <FileAudio className="h-6 w-6 text-purple-500" />}
                  {fileType === 'video' && <FileVideo className="h-6 w-6 text-rose-500" />}
                  {fileType === 'document' && <FileText className="h-6 w-6 text-orange-500" />}
                  {!fileType && <FileText className="h-6 w-6 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">资料标题</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入资料标题"
                />
              </div>

              <div className="space-y-2">
                <Label>文件类型</Label>
                <div className="flex flex-wrap gap-2">
                  {FILE_TYPES.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => setFileType(type.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm transition-all",
                        fileType === type.value
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                          : "hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>选择目录</Label>
                <Select value={diseaseTag} onValueChange={setDiseaseTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择所属目录..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>取消</Button>
          <Button onClick={handleUpload} disabled={!file || !fileType || !diseaseTag || !title || isUploading}>
            {isUploading ? '上传中...' : '开始上传'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
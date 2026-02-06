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
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [currentXhr, setCurrentXhr] = useState<XMLHttpRequest | null>(null);
  const [compressEnabled, setCompressEnabled] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [ffmpeg, setFfmpeg] = useState<any>(null);
  const [ffFetchFile, setFfFetchFile] = useState<any>(null);
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
      const limit = compressEnabled ? 2 * 1024 * 1024 * 1024 : 500 * 1024 * 1024;
      if (selectedFile.size > limit) {
        toast({
          title: '文件过大',
          description: compressEnabled ? '压缩上传模式下最大支持 2GB' : '单个文件最大支持 500MB，可开启压缩上传',
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

    let fileToUpload: File = file;
    if (compressEnabled && fileType === 'video') {
      try {
        if (!ffmpegReady) {
          setIsCompressing(true);
          setCompressProgress(5);
          let createFFmpegFn: any = null;
          let fetchFileFn: any = null;
          try {
            const mod: any = await import(/* @vite-ignore */ '@ffmpeg/ffmpeg');
            createFFmpegFn = mod.createFFmpeg || mod.default?.createFFmpeg;
            fetchFileFn = mod.fetchFile || mod.default?.fetchFile;
          } catch {}
          if (!createFFmpegFn || !fetchFileFn) {
            try {
              await new Promise<void>((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/ffmpeg.min.js';
                s.onload = () => resolve();
                s.onerror = () => reject(new Error('加载 UMD 版 ffmpeg 失败'));
                document.head.appendChild(s);
              });
              const globalFF = (window as any).FFmpeg;
              createFFmpegFn = globalFF?.createFFmpeg;
              fetchFileFn = globalFF?.fetchFile;
            } catch {}
          }
          if (!createFFmpegFn || !fetchFileFn) {
            throw new Error('ffmpeg 模块加载失败');
          }
          const instance = createFFmpegFn({
            log: false,
            corePath: 'https://unpkg.com/@ffmpeg/core@0.12.7/dist/ffmpeg-core.js'
          });
          setFfmpeg(instance);
          setFfFetchFile(() => fetchFileFn);
          await instance.load();
          setFfmpegReady(true);
        }
        setIsCompressing(true);
        setCompressProgress(10);
        ffmpeg.setLogger(({ message }: any) => {
          if (message.includes('frame=')) {
            const m = /time=(\\S+)/.exec(message);
            if (m) setCompressProgress((p) => Math.min(p + 1, 90));
          }
        });
        ffmpeg.setProgress(({ ratio }: any) => {
          setCompressProgress(Math.min(90, Math.floor(ratio * 90)));
        });
        const inName = 'input.mp4';
        const outName = 'output.mp4';
        ffmpeg.FS('writeFile', inName, await ffFetchFile(file));
        await ffmpeg.run(
          '-i', inName,
          '-vf', 'scale=-2:720',
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-b:v', '2000k',
          '-c:a', 'aac',
          '-b:a', '128k',
          outName
        );
        const data = ffmpeg.FS('readFile', outName);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        fileToUpload = new File([blob], file.name.replace(/\.[^\\.]+$/, '') + '.mp4', { type: 'video/mp4' });
        setCompressProgress(100);
        setIsCompressing(false);
      } catch (e: any) {
        setIsCompressing(false);
        toast({
          title: '压缩失败，改用服务器压缩',
          description: e?.message || '将上传原视频并由服务器转码',
        });
        // 不返回，继续走服务器压缩（compress=true）
      }
    }

    setIsUploading(true);
    setLoaded(0);
    setTotal(fileToUpload.size);
    setStartTs(Date.now());
    try {
      const compressServer = compressEnabled && fileType === 'video' && fileToUpload === file;
      const { xhr, promise } = fileService.createUploadWithProgress(
        fileToUpload,
        fileType!,
        diseaseTag,
        title,
        compressServer,
        (l, t) => {
          setLoaded(l);
          setTotal(t);
        },
        (msg) => {
          toast({
            title: '上传失败',
            description: msg,
            variant: 'destructive',
          });
        }
      );
      setCurrentXhr(xhr);
      await promise;
      toast({
        title: '上传成功',
        description: `${title} 已添加到资料库`,
      });
      setIsUploading(false);
      setCurrentXhr(null);
      onUploadComplete();
      handleClose();
    } catch (error: any) {
      setIsUploading(false);
      setCurrentXhr(null);
      toast({
        title: '上传失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleCancelUpload = () => {
    try {
      currentXhr?.abort();
    } catch {}
    setIsUploading(false);
    setCurrentXhr(null);
    toast({
      title: '已取消上传',
      description: file ? `${file.name} 上传已取消` : undefined,
    });
  };

  const handleClose = () => {
    setFile(null);
    setFileType(null);
    setTitle('');
    setDiseaseTag('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
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

              {fileType === 'video' && (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Switch checked={compressEnabled} onCheckedChange={setCompressEnabled} />
                    <span className="text-sm">压缩上传（720p，约 2Mbps）</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {compressEnabled ? '推荐：减少上传体积' : '关闭：保持原始质量'}
                  </span>
                </div>
              )}

              {isCompressing && (
                <div className="space-y-2 p-3 rounded-lg border bg-muted/40">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>压缩中</span>
                    <span>{Math.min(100, compressProgress)}%</span>
                  </div>
                  <Progress value={compressProgress} />
                </div>
              )}

              {isUploading && (
                <div className="space-y-2 p-3 rounded-lg border bg-muted/40">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {total ? Math.floor((loaded / total) * 100) : 0}%
                    </span>
                    <span>
                      {(() => {
                        if (!startTs || !total) return '';
                        const elapsed = (Date.now() - startTs) / 1000;
                        const speed = loaded / 1024 / 1024 / Math.max(elapsed, 0.001);
                        const remain = total - loaded;
                        const eta = speed > 0 ? remain / 1024 / 1024 / speed : 0;
                        return `速度 ${speed.toFixed(2)} MB/s · 剩余 ${Math.ceil(eta)}s`;
                      })()}
                    </span>
                  </div>
                  <Progress value={total ? (loaded / total) * 100 : 0} />
                </div>
              )}

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
                  <SelectContent position="popper">
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
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>取消</Button>
          {isUploading && (
            <Button variant="destructive" onClick={handleCancelUpload}>
              取消上传
            </Button>
          )}
          <Button onClick={handleUpload} disabled={!file || !fileType || !diseaseTag || !title || isUploading}>
            {isUploading ? '上传中...' : '开始上传'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

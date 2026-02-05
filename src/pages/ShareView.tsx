import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { shareService } from '@/services/api';
import { MedFile } from '@/types/medarchive';

const ShareView = () => {
  const { token } = useParams();
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [data, setData] = useState<MedFile | null>(null);

  useEffect(() => {
    const fetchShare = async () => {
      if (!token) {
        setError("无效的分享链接");
        setIsLoading(false);
        return;
      }

      try {
        const { resource } = await shareService.getShareByToken(token);
        setData(resource);
      } catch (err: any) {
        setError(err.message || "无法加载分享内容");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShare();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              链接无效
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-amber-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-amber-100 p-3 rounded-full w-fit mb-4">
              <ShieldCheck className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-xl">学术资料访问声明</CardTitle>
            <CardDescription>
              您正在访问一份内部医学教学资料
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>严禁外传</AlertTitle>
              <AlertDescription>
                此资料包含敏感临床信息，仅供内部学术交流与教学复盘使用。
                <br/>
                <strong>严禁下载后发布到社交媒体或发送给非授权人员。</strong>
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground bg-slate-50 p-4 rounded-lg border">
              <p className="mb-2 font-medium text-foreground">访问者承诺：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>仅用于个人学习和学术研究</li>
                <li>不保存、不转发、不公开展示</li>
                <li>严格遵守患者隐私保护条例</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full h-11 text-base" 
              onClick={() => setAccepted(true)}
            >
              我已知晓并同意上述条款
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center opacity-[0.03] rotate-[-15deg] overflow-hidden">
        <div className="text-9xl font-black whitespace-nowrap select-none">
          仅供内部学术交流 严禁外传
        </div>
      </div>

      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-tight">{data.name}</h1>
            <p className="text-xs text-muted-foreground">
              创建于 {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '未知日期'}
            </p>
          </div>
        </div>
        <Button variant="outline" disabled title="为了数据安全，禁止下载">
          <Download className="h-4 w-4 mr-2" />
          下载
        </Button>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto p-6 relative z-0">
        <Card className="min-h-[500px] flex items-center justify-center bg-white shadow-sm border-dashed p-4">
          <div className="text-center text-muted-foreground w-full">
            {data.type === 'audio' ? (
              <div className="w-full max-w-md mx-auto bg-slate-100 p-8 rounded-xl">
                 <p className="mb-4">正在播放音频...</p>
                 <audio src={data.fileUrl} controls className="w-full" />
              </div>
            ) : data.type === 'video' ? (
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video src={data.fileUrl} controls className="w-full h-full" />
              </div>
            ) : data.type === 'image' ? (
               <img src={data.fileUrl} alt={data.name} className="max-w-full max-h-[500px] mx-auto rounded-lg" />
            ) : (
              <div className="p-8">
                 <p className="mb-4">此文档无法直接预览</p>
                 <a href={data.fileUrl} download className="text-primary hover:underline">点击下载文件</a>
              </div>
            )}
          </div>
        </Card>
        
      </main>
    </div>
  );
};

export default ShareView;

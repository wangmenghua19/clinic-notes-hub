 import { useState } from 'react';
 import { Copy, Check, Clock, Flame, Link2 } from 'lucide-react';
 import { MedFile, ShareLink } from '@/types/medarchive';
 import { shareService } from '@/services/api';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { cn } from '@/lib/utils';
 import { useToast } from '@/hooks/use-toast';
 
 interface ShareDialogProps {
   file: MedFile | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function ShareDialog({ file, open, onOpenChange }: ShareDialogProps) {
   const [expiryType, setExpiryType] = useState<'burn' | '24h'>('24h');
   const [shareLink, setShareLink] = useState<ShareLink | null>(null);
   const [isGenerating, setIsGenerating] = useState(false);
   const [copied, setCopied] = useState(false);
   const { toast } = useToast();
 
   const handleGenerateLink = async () => {
     if (!file) return;
 
     setIsGenerating(true);
     try {
       const link = await shareService.createShareLink(file.id, expiryType);
       setShareLink(link);
     } catch {
       toast({
         title: '生成失败',
         description: '请稍后重试',
         variant: 'destructive',
       });
     } finally {
       setIsGenerating(false);
     }
   };
 
   const handleCopy = async () => {
     if (!shareLink) return;
     
     await navigator.clipboard.writeText(shareLink.url);
     setCopied(true);
     toast({
       title: '已复制链接',
       description: '可以发送给同事了',
     });
     setTimeout(() => setCopied(false), 2000);
   };
 
   const handleClose = () => {
     setShareLink(null);
     setCopied(false);
     onOpenChange(false);
   };
 
   return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            分享资料
          </DialogTitle>
          {file && (
            <DialogDescription className="text-sm truncate">
              {file.name}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {!shareLink ? (
            <>
              {/* Disclaimer Preview */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200/60 text-amber-800 text-sm">
                 <p className="font-medium flex items-center gap-2 mb-1">
                   <span className="bg-amber-100 p-1 rounded">⚠️ 学术交流专用模式</span>
                 </p>
                 <p className="opacity-90">
                   生成的链接在访问时将<strong>强制全屏显示免责声明</strong>，访问者需确认“严禁外传”后方可查看内容。
                 </p>
              </div>

              {/* Expiry Type Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  有效期设置
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={expiryType === '24h' ? 'default' : 'outline'}
                    className={cn("h-auto py-3 flex flex-col gap-1", expiryType === '24h' && "border-primary")}
                    onClick={() => setExpiryType('24h')}
                  >
                    <Clock className="h-5 w-5 mb-1" />
                    <span className="font-semibold">24小时有效</span>
                    <span className="text-[10px] opacity-80 font-normal">适合临时分享</span>
                  </Button>

                  <Button
                    variant={expiryType === 'long-term' ? 'default' : 'outline'}
                    className={cn("h-auto py-3 flex flex-col gap-1", expiryType === 'long-term' && "border-primary")}
                    onClick={() => setExpiryType('long-term')}
                  >
                    <Flame className="h-5 w-5 mb-1" />
                    <span className="font-semibold">长期有效</span>
                    <span className="text-[10px] opacity-80 font-normal">适合永久归档</span>
                  </Button>
                </div>
              </div>
 
               <Button
                 className="w-full h-12 touch-target text-base"
                 onClick={handleGenerateLink}
                 disabled={isGenerating}
               >
                 {isGenerating ? '生成中...' : '生成分享链接'}
               </Button>
             </>
           ) : (
             <>
               {/* Generated Link */}
               <div className="space-y-3">
                 <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
                   {expiryType === 'burn' ? (
                     <Flame className="h-5 w-5 text-destructive" />
                   ) : (
                     <Clock className="h-5 w-5 text-warning" />
                   )}
                   <span className="text-sm">
                     {expiryType === 'burn' ? '链接仅可查看一次' : '链接将在 24 小时后失效'}
                   </span>
                 </div>
 
                 <div className="flex gap-2">
                   <Input
                     value={shareLink.url}
                     readOnly
                     className="font-mono text-sm"
                   />
                   <Button
                     variant="default"
                     size="icon"
                     className="h-10 w-10 flex-shrink-0"
                     onClick={handleCopy}
                   >
                     {copied ? (
                       <Check className="h-4 w-4" />
                     ) : (
                       <Copy className="h-4 w-4" />
                     )}
                   </Button>
                 </div>
               </div>
 
               <Button
                 variant="outline"
                 className="w-full h-12 touch-target"
                 onClick={() => setShareLink(null)}
               >
                 生成新链接
               </Button>
             </>
           )}
 
           {/* Watermark Notice */}
           <p className="text-xs text-muted-foreground text-center">
             分享内容将显示"仅供内部交流"水印
           </p>
         </div>
       </DialogContent>
     </Dialog>
   );
 }
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
               {/* Expiry Type Selection */}
               <div>
                 <label className="text-sm font-medium mb-3 block">
                   有效期设置
                 </label>
                 <div className="grid grid-cols-2 gap-3">
                   <Button
                     type="button"
                     variant={expiryType === 'burn' ? 'default' : 'outline'}
                     className={cn(
                       'h-20 flex-col gap-2 touch-target',
                       expiryType === 'burn' && 'ring-2 ring-primary ring-offset-2'
                     )}
                     onClick={() => setExpiryType('burn')}
                   >
                     <Flame className="h-6 w-6" />
                     <span>阅后即焚</span>
                   </Button>
                   <Button
                     type="button"
                     variant={expiryType === '24h' ? 'default' : 'outline'}
                     className={cn(
                       'h-20 flex-col gap-2 touch-target',
                       expiryType === '24h' && 'ring-2 ring-primary ring-offset-2'
                     )}
                     onClick={() => setExpiryType('24h')}
                   >
                     <Clock className="h-6 w-6" />
                     <span>24小时有效</span>
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
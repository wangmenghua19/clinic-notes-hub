 import { FolderOpen, Upload } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 
 interface EmptyStateProps {
   isSearching: boolean;
   onUploadClick: () => void;
 }
 
 export function EmptyState({ isSearching, onUploadClick }: EmptyStateProps) {
   return (
     <div className="text-center py-16 px-4">
       <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
         <FolderOpen className="h-10 w-10 text-muted-foreground" />
       </div>
       
       {isSearching ? (
         <>
           <h3 className="text-lg font-medium mb-2">未找到相关资料</h3>
           <p className="text-muted-foreground mb-6">
             尝试使用其他关键词或标签搜索
           </p>
         </>
       ) : (
         <>
           <h3 className="text-lg font-medium mb-2">资料库为空</h3>
           <p className="text-muted-foreground mb-6">
             上传您的第一份临床资料
           </p>
           <Button onClick={onUploadClick} className="h-12 px-6 touch-target">
             <Upload className="h-5 w-5 mr-2" />
             上传资料
           </Button>
         </>
       )}
     </div>
   );
 }
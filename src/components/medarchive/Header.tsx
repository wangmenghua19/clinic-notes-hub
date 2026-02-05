 import { Plus, Archive } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 
 interface HeaderProps {
   onUploadClick: () => void;
 }
 
 export function Header({ onUploadClick }: HeaderProps) {
   return (
     <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b">
       <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
             <Archive className="h-5 w-5 text-primary-foreground" />
           </div>
           <div>
             <h1 className="font-semibold text-lg leading-tight">MedArchive</h1>
             <p className="text-xs text-muted-foreground">临床资料管理库</p>
           </div>
         </div>
 
         <Button 
           onClick={onUploadClick}
           className="h-11 px-5 touch-target gap-2"
         >
           <Plus className="h-5 w-5" />
           <span className="hidden sm:inline">上传资料</span>
         </Button>
       </div>
     </header>
   );
 }
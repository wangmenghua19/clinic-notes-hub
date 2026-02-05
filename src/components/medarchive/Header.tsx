import { Plus, Archive, Search, Menu, X } from 'lucide-react';
 import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
 
 interface HeaderProps {
   onUploadClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
 }
 
export function Header({ 
  onUploadClick, 
  searchQuery, 
  onSearchChange,
  sidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
   return (
     <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b">
      <div className="h-16 flex items-center justify-between px-4 gap-4">
        {/* Left: Logo & Menu Toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10"
            onClick={onToggleSidebar}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
           <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
             <Archive className="h-5 w-5 text-primary-foreground" />
           </div>
          <div className="hidden sm:block">
             <h1 className="font-semibold text-lg leading-tight">MedArchive</h1>
             <p className="text-xs text-muted-foreground">临床资料管理库</p>
           </div>
         </div>
 
        {/* Center: Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索文件名或病种..."
              className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => onSearchChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right: Upload Button */}
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
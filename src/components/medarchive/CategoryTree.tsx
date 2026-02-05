import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, Tag, Users, Plus, FolderPlus } from 'lucide-react';
import { CategoryNode } from '@/types/medarchive';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { categoryService } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface CategoryTreeProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null, type: 'all' | 'group' | 'tag', value?: string) => void;
}

export function CategoryTree({ selectedCategory, onCategorySelect }: CategoryTreeProps) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsCreating(true);
    try {
      // Create new category (default type: tag, or we could let user choose 'group')
      // For simplicity, we treat all as top-level tags/folders for now.
      await categoryService.createCategory(newCategoryName, 'tag');
      
      toast({
        title: "目录创建成功",
        description: `已添加目录 "${newCategoryName}"`,
      });
      
      setNewCategoryName('');
      setIsAddDialogOpen(false);
      loadCategories(); // Refresh list
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 border-r">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Folder className="h-5 w-5 text-primary" />
          资料目录
        </h2>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {/* All Files Option */}
          <button
            onClick={() => onCategorySelect(null, 'all')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-left',
              'hover:bg-accent',
              selectedCategory === null && 'bg-primary/10 text-primary font-medium'
            )}
          >
            <Folder className="h-4 w-4 text-primary flex-shrink-0" />
            全部资料
          </button>

          {/* Dynamic Categories */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.name, category.type === 'group' ? 'group' : 'tag', category.name)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-left',
                'hover:bg-accent',
                selectedCategory === category.name && 'bg-primary/10 text-primary font-medium'
              )}
            >
              {category.type === 'group' ? (
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate">{category.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white">
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <FolderPlus className="h-4 w-4" />
          新建目录
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新建目录</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                名称
              </Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="col-span-3"
                placeholder="输入目录名称..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim() || isCreating}>
              {isCreating ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
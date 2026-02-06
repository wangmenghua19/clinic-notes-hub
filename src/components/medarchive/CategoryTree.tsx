import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, Tag, Users, Plus, FolderPlus, Edit3 } from 'lucide-react';
import { CategoryNode } from '@/types/medarchive';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { categoryService, fileService } from '@/services/api';
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const dbCats = await categoryService.getCategories();
      // Also derive categories from resources currently in library
      const files = await fileService.getFiles();
      const resourceCats = Array.from(new Set(files.map(f => f.diseaseTag))).map((name) => ({
        id: '', // unknown id for resource-derived categories
        name,
        type: 'tag' as const,
        count: 0,
      }));
      // Merge by name, prefer db records when exists
      const byName = new Map<string, CategoryNode>();
      [...resourceCats, ...dbCats].forEach((c) => {
        byName.set(c.name, c.id ? c : { ...c, id: c.id || '' });
      });
      setCategories(Array.from(byName.values()));
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

  const openEdit = (cat: CategoryNode) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setIsEditDialogOpen(true);
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;
    if (!editName.trim()) return;
    const trimmed = editName.trim();
    const isDuplicate = categories.some(c => c.name === trimmed && c.id !== editingCategory.id);
    if (isDuplicate) {
      toast({
        title: "更新失败",
        description: "与现存已有目录重名",
        variant: "destructive"
      });
      return;
    }
    try {
      const idStr = editingCategory.id ?? '';
      const hasNumericId = /^\d+$/.test(idStr);
      if (hasNumericId) await categoryService.updateCategory(editingCategory.id, trimmed);
      else await categoryService.renameByName(editingCategory.name, trimmed);
      toast({
        title: "目录更新成功",
        description: `已将目录重命名为 "${trimmed}"`,
      });
      // If currently filtering by this category, keep selection and update to new name
      if (selectedCategory === editingCategory.name) {
        onCategorySelect(trimmed, editingCategory.type === 'group' ? 'group' : 'tag', trimmed);
      }
      // Notify global listeners to refresh files even if not filtering by this category
      try {
        window.dispatchEvent(
          new CustomEvent('medarchive:categories-updated', {
            detail: { from: editingCategory.name, to: trimmed }
          })
        );
      } catch {}
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      setEditName('');
      loadCategories();
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive"
      });
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
            <div key={category.id || category.name} className="flex items-center justify-between gap-2">
              <button
                onClick={() => onCategorySelect(category.name, category.type === 'group' ? 'group' : 'tag', category.name)}
                className={cn(
                  'flex-1 flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-left',
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEdit(category)}
                aria-label="编辑目录名称"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑目录名称</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                名称
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="col-span-3"
                placeholder="输入新的目录名称..."
                autoFocus
              />
            </div>
            {(() => {
              const trimmed = editName.trim();
              const isDuplicate = editingCategory && categories.some(c => c.name === trimmed && c.id !== editingCategory.id);
              return isDuplicate ? (
                <div className="text-xs text-destructive px-1">
                  与现存已有目录重名
                </div>
              ) : null;
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
            <Button
              onClick={handleEditCategory}
              disabled={
                !editName.trim() ||
                (editingCategory ? categories.some(c => c.name === editName.trim() && c.id !== editingCategory.id) : false)
              }
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

 import { useState } from 'react';
 import { ChevronRight, ChevronDown, Folder, FolderOpen, Tag, Users } from 'lucide-react';
 import { CategoryNode, DiseaseTag, ResearchGroup } from '@/types/medarchive';
 import { cn } from '@/lib/utils';
 import { ScrollArea } from '@/components/ui/scroll-area';
 
 // Mock category data
 const categoryData: CategoryNode[] = [
   {
     id: 'all',
     name: '全部资料',
     type: 'group',
     count: 24,
   },
   {
     id: 'by-group',
     name: '按教研组',
     type: 'group',
     count: 24,
     children: [
       { id: 'g1', name: '口腔正畸科', type: 'group', count: 8 },
       { id: 'g2', name: '口腔种植科', type: 'group', count: 5 },
       { id: 'g3', name: '牙体牙髓科', type: 'group', count: 4 },
       { id: 'g4', name: '牙周病科', type: 'group', count: 3 },
       { id: 'g5', name: '儿童口腔科', type: 'group', count: 2 },
       { id: 'g6', name: '口腔修复科', type: 'group', count: 2 },
     ],
   },
   {
     id: 'by-disease',
     name: '按病种分类',
     type: 'group',
     count: 24,
     children: [
       { id: 'd1', name: '正畸', type: 'tag', count: 6 },
       { id: 'd2', name: '植牙', type: 'tag', count: 5 },
       { id: 'd3', name: '根管治疗', type: 'tag', count: 4 },
       { id: 'd4', name: '牙周病', type: 'tag', count: 3 },
       { id: 'd5', name: '儿童齿科', type: 'tag', count: 3 },
       { id: 'd6', name: '美白', type: 'tag', count: 2 },
       { id: 'd7', name: '修复', type: 'tag', count: 1 },
     ],
   },
 ];
 
 interface CategoryTreeProps {
   selectedCategory: string | null;
   onCategorySelect: (category: string | null, type: 'all' | 'group' | 'tag', value?: string) => void;
 }
 
 interface TreeNodeProps {
   node: CategoryNode;
   level: number;
   selectedCategory: string | null;
   onSelect: (id: string, type: 'all' | 'group' | 'tag', name: string) => void;
 }
 
 function TreeNode({ node, level, selectedCategory, onSelect }: TreeNodeProps) {
   const [isOpen, setIsOpen] = useState(level === 0 || node.id === 'all');
   const hasChildren = node.children && node.children.length > 0;
   const isSelected = selectedCategory === node.id;
 
   const handleClick = () => {
     if (hasChildren) {
       setIsOpen(!isOpen);
     }
     const selectType = node.id === 'all' ? 'all' : node.type === 'tag' ? 'tag' : 'group';
     onSelect(node.id, selectType, node.name);
   };
 
   return (
     <div>
       <button
         onClick={handleClick}
         className={cn(
           'w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-left touch-target',
           'hover:bg-accent',
           isSelected && 'bg-primary/10 text-primary font-medium',
           level > 0 && 'ml-4'
         )}
         style={{ paddingLeft: `${12 + level * 16}px` }}
       >
         {hasChildren ? (
           isOpen ? (
             <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
           ) : (
             <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
           )
         ) : (
           <span className="w-4" />
         )}
         
         {node.id === 'all' ? (
           <Folder className="h-4 w-4 text-primary flex-shrink-0" />
         ) : node.id === 'by-group' ? (
           <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
         ) : node.type === 'tag' ? (
           <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
         ) : hasChildren ? (
           isOpen ? (
             <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
           ) : (
             <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
           )
         ) : (
           <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
         )}
         
         <span className="flex-1 truncate">{node.name}</span>
         <span className="text-xs text-muted-foreground tabular-nums">{node.count}</span>
       </button>
       
       {hasChildren && isOpen && (
         <div className="mt-1">
           {node.children!.map((child) => (
             <TreeNode
               key={child.id}
               node={child}
               level={level + 1}
               selectedCategory={selectedCategory}
               onSelect={onSelect}
             />
           ))}
         </div>
       )}
     </div>
   );
 }
 
 export function CategoryTree({ selectedCategory, onCategorySelect }: CategoryTreeProps) {
   const handleSelect = (id: string, type: 'all' | 'group' | 'tag', name: string) => {
     onCategorySelect(id, type, name);
   };
 
   return (
     <ScrollArea className="h-full">
       <div className="p-3 space-y-1">
         <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
           资料分类
         </div>
         {categoryData.map((node) => (
           <TreeNode
             key={node.id}
             node={node}
             level={0}
             selectedCategory={selectedCategory}
             onSelect={handleSelect}
           />
         ))}
       </div>
     </ScrollArea>
   );
 }
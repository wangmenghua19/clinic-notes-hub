 import { DiseaseTag } from '@/types/medarchive';
 import { Badge } from '@/components/ui/badge';
 import { cn } from '@/lib/utils';
 
 const ALL_TAGS: DiseaseTag[] = [
   '正畸',
   '植牙',
   '根管治疗',
   '牙周病',
   '儿童齿科',
   '美白',
   '修复',
   '其他',
 ];
 
 interface TagFilterProps {
   selectedTag: DiseaseTag | null;
   onTagSelect: (tag: DiseaseTag | null) => void;
 }
 
 export function TagFilter({ selectedTag, onTagSelect }: TagFilterProps) {
   return (
     <div className="flex flex-wrap gap-2">
       <Badge
         variant={selectedTag === null ? 'default' : 'outline'}
         className={cn(
           'cursor-pointer touch-target px-4 py-2 text-sm transition-colors',
           selectedTag === null 
             ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
             : 'hover:bg-accent'
         )}
         onClick={() => onTagSelect(null)}
       >
         全部
       </Badge>
       {ALL_TAGS.map((tag) => (
         <Badge
           key={tag}
           variant={selectedTag === tag ? 'default' : 'outline'}
           className={cn(
             'cursor-pointer touch-target px-4 py-2 text-sm transition-colors',
             selectedTag === tag 
               ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
               : 'hover:bg-accent'
           )}
           onClick={() => onTagSelect(tag)}
         >
           {tag}
         </Badge>
       ))}
     </div>
   );
 }
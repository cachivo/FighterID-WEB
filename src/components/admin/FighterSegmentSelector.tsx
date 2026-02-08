import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users, Loader2 } from "lucide-react";

interface FighterSegmentSelectorProps {
  selectedDisciplines: string[];
  onDisciplinesChange: (disciplines: string[]) => void;
  selectedLevels: string[];
  onLevelsChange: (levels: string[]) => void;
  onCountUpdate: (count: number) => void;
}

const DISCIPLINES = ["MMA", "Boxeo"];
const LEVELS = ["Profesional", "Semi-profesional", "Amateur"];

export default function FighterSegmentSelector({
  selectedDisciplines,
  onDisciplinesChange,
  selectedLevels,
  onLevelsChange,
  onCountUpdate,
}: FighterSegmentSelectorProps) {
  // Fetch all fighter counts grouped by discipline and level
  const { data: fighters, isLoading } = useQuery({
    queryKey: ["fighter-segment-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fighter_profiles")
        .select("id, discipline, level, user_id")
        .eq("active", true)
        .not("user_id", "is", null);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  // Calculate counts by discipline
  const disciplineCounts = useMemo(() => {
    if (!fighters) return {};
    return DISCIPLINES.reduce((acc, discipline) => {
      acc[discipline] = fighters.filter((f) => f.discipline === discipline).length;
      return acc;
    }, {} as Record<string, number>);
  }, [fighters]);

  // Calculate counts by level
  const levelCounts = useMemo(() => {
    if (!fighters) return {};
    return LEVELS.reduce((acc, level) => {
      acc[level] = fighters.filter((f) => f.level === level).length;
      return acc;
    }, {} as Record<string, number>);
  }, [fighters]);

  // Calculate filtered count based on selections
  const filteredCount = useMemo(() => {
    if (!fighters) return 0;

    let filtered = fighters;

    if (selectedDisciplines.length > 0) {
      filtered = filtered.filter((f) => selectedDisciplines.includes(f.discipline || ""));
    }

    if (selectedLevels.length > 0) {
      filtered = filtered.filter((f) => selectedLevels.includes(f.level || ""));
    }

    return filtered.length;
  }, [fighters, selectedDisciplines, selectedLevels]);

  // Notify parent of count changes
  // Note: intentionally omitting onCountUpdate from deps to avoid infinite loops
  // when parent doesn't memoize the callback
  useEffect(() => {
    onCountUpdate(filteredCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCount]);

  const toggleDiscipline = (discipline: string) => {
    if (selectedDisciplines.includes(discipline)) {
      onDisciplinesChange(selectedDisciplines.filter((d) => d !== discipline));
    } else {
      onDisciplinesChange([...selectedDisciplines, discipline]);
    }
  };

  const toggleLevel = (level: string) => {
    if (selectedLevels.includes(level)) {
      onLevelsChange(selectedLevels.filter((l) => l !== level));
    } else {
      onLevelsChange([...selectedLevels, level]);
    }
  };

  // Build description for preview
  const getSegmentDescription = () => {
    const parts: string[] = [];
    if (selectedDisciplines.length > 0) {
      parts.push(selectedDisciplines.join(" y "));
    }
    if (selectedLevels.length > 0) {
      parts.push(selectedLevels.join(", "));
    }
    return parts.length > 0 ? parts.join(" - ") : "Todos los peleadores";
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando segmentos...
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Disciplines column */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Disciplina</Label>
          <div className="space-y-2">
            {DISCIPLINES.map((discipline) => (
              <div key={discipline} className="flex items-center gap-2">
                <Checkbox
                  id={`discipline-${discipline}`}
                  checked={selectedDisciplines.includes(discipline)}
                  onCheckedChange={() => toggleDiscipline(discipline)}
                />
                <Label
                  htmlFor={`discipline-${discipline}`}
                  className="text-sm cursor-pointer flex items-center gap-2"
                >
                  {discipline}
                  <span className="text-xs text-muted-foreground">
                    ({disciplineCounts[discipline] || 0})
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Levels column */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Nivel</Label>
          <div className="space-y-2">
            {LEVELS.map((level) => (
              <div key={level} className="flex items-center gap-2">
                <Checkbox
                  id={`level-${level}`}
                  checked={selectedLevels.includes(level)}
                  onCheckedChange={() => toggleLevel(level)}
                />
                <Label
                  htmlFor={`level-${level}`}
                  className="text-sm cursor-pointer flex items-center gap-2"
                >
                  {level}
                  <span className="text-xs text-muted-foreground">
                    ({levelCounts[level] || 0})
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview counter */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Users className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {filteredCount} peleador{filteredCount !== 1 ? "es" : ""} serán contactados
        </span>
        {(selectedDisciplines.length > 0 || selectedLevels.length > 0) && (
          <span className="text-xs text-muted-foreground">
            ({getSegmentDescription()})
          </span>
        )}
      </div>
    </div>
  );
}

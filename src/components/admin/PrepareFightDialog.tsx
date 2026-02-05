import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Judge } from '@/hooks/useJudges';

interface PrepareFightDialogProps {
  fight: any;
  availableJudges: Judge[];
}

export function PrepareFightDialog({ fight, availableJudges }: PrepareFightDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJudges, setSelectedJudges] = useState<string[]>(['', '', '']);
  const [selectedReferee, setSelectedReferee] = useState('');
  const [loading, setLoading] = useState(false);
  const [preparationResult, setPreparationResult] = useState<any>(null);
  const { toast } = useToast();

  const handleJudgeSelection = (index: number, judgeId: string) => {
    const newJudges = [...selectedJudges];
    newJudges[index] = judgeId;
    setSelectedJudges(newJudges);
  };

  const getAvailableJudgesForSlot = (currentIndex: number) => {
    return availableJudges.filter(judge => 
      !selectedJudges.includes(judge.id) || selectedJudges[currentIndex] === judge.id
    );
  };

  const getAvailableReferees = () => {
    return availableJudges.filter(judge => 
      (judge.specialization.includes('Referee') || judge.specialization.includes('MMA')) &&
      !selectedJudges.includes(judge.id)
    );
  };

  const handlePrepare = async () => {
    if (selectedJudges.some(j => !j) || !selectedReferee) {
      toast({
        title: "Error",
        description: "Debes seleccionar 3 jueces y 1 referee",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('prepare_fight_for_scoring', {
      p_fight_id: fight.id,
      p_judge_1_id: selectedJudges[0],
      p_judge_2_id: selectedJudges[1],
      p_judge_3_id: selectedJudges[2],
      p_referee_id: selectedReferee
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setPreparationResult(data);
    toast({
      title: "Pelea Preparada",
      description: "Rounds creados y oficiales asignados exitosamente"
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(window.location.origin + text);
    toast({ 
      title: "Copiado", 
      description: `${label} copiada al portapapeles` 
    });
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Settings className="mr-2 h-3 w-3" />
          Preparar Pelea
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preparar Pelea para Scoring</DialogTitle>
          <DialogDescription>
            Asigna 3 jueces y 1 referee. Se crearán automáticamente 3 rounds de 5 minutos.
          </DialogDescription>
        </DialogHeader>

        {!preparationResult ? (
          <>
            <div className="space-y-6">
              {/* Judge Selection */}
              <div className="space-y-4">
                <h3 className="font-medium">Jueces</h3>
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-2">
                    <label className="text-sm text-muted-foreground">Juez {index + 1}</label>
                    <Select 
                      value={selectedJudges[index]} 
                      onValueChange={(value) => handleJudgeSelection(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Seleccionar Juez ${index + 1}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableJudgesForSlot(index).map(judge => (
                          <SelectItem key={judge.id} value={judge.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{judge.first_name} {judge.last_name}</span>
                              <Badge variant="outline" className="ml-2">
                                {judge.certification_level}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Referee Selection */}
              <div className="space-y-2">
                <h3 className="font-medium">Referee</h3>
                <Select value={selectedReferee} onValueChange={setSelectedReferee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar Referee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableReferees().map(judge => (
                      <SelectItem key={judge.id} value={judge.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{judge.first_name} {judge.last_name}</span>
                          <Badge variant="outline" className="ml-2">
                            {judge.certification_level}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePrepare} disabled={loading}>
                {loading ? 'Preparando...' : 'Preparar y Generar URLs'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-lg p-4">
                <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                  Pelea Preparada Exitosamente
                </h3>
                <p className="text-sm text-muted-foreground">
                  Se crearon {preparationResult.rounds?.length || 3} rounds y se asignaron los oficiales.
                </p>
              </div>

              {/* Judge Panel URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Panel de Jueces</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={window.location.origin + preparationResult.judge_panel_url}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(preparationResult.judge_panel_url, 'URL del Panel de Jueces')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => openInNewTab(preparationResult.judge_panel_url)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* HUD URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">HUD Público (Pantalla)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={window.location.origin + preparationResult.hud_url}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(preparationResult.hud_url, 'URL del HUD')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => openInNewTab(preparationResult.hud_url)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => {
                setIsOpen(false);
                setPreparationResult(null);
                setSelectedJudges(['', '', '']);
                setSelectedReferee('');
              }}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

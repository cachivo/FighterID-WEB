import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FighterCard } from '@/components/FighterCard';
import { FighterProfileForm } from '@/components/FighterProfileForm';
import { useFighterProfiles, FighterProfile } from '@/hooks/useFighterProfiles';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, Filter, ArrowUpDown, Users, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const WEIGHT_CLASSES = [
  'Todos',
  'Peso Mosca (125 lbs)',
  'Peso Gallo (135 lbs)', 
  'Peso Pluma (145 lbs)',
  'Peso Ligero (155 lbs)',
  'Peso Welter (170 lbs)',
  'Peso Medio (185 lbs)',
  'Peso Semipesado (205 lbs)',
  'Peso Pesado (265 lbs)',
];

const DISCIPLINES = [
  'Todas',
  'MMA',
  'Boxeo',
  'Judo',
  'JiuJitsu',
  'Kickboxing',
  'MuayThai',
  'Grappling',
  'Otro'
];

const FIGHTING_STYLES = [
  'Todos',
  'Striker',
  'Brawler/Agresivo',
  'Contra-Atacador',
  'LUDUS CERBERUS',
  'ALFA Y OMEGA MMA',
  'SCHUMMANS/COMAYAGUA',
  'TEMPLO DEL TIGRE'
];

const RECORD_TYPES = [
  'Todos',
  'Amateur',
  'Profesional'
];

export default function Fighters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeightClass, setSelectedWeightClass] = useState('Todos');
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todas');
  const [selectedFightingStyle, setSelectedFightingStyle] = useState('Todos');
  const [selectedRecordType, setSelectedRecordType] = useState('Todos');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [readyToFightOnly, setReadyToFightOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState<FighterProfile | null>(null);
  const [userProfile, setUserProfile] = useState<FighterProfile | null>(null);
  
  const { fighters, loading, loadingUserProfile, getUserFighterProfile, fetchFighters, fetchFightersWithReadyStatus } = useFighterProfiles();
  const { user } = useAuth();

  const handleCreateSuccess = useCallback(() => {
    setIsCreateDialogOpen(false);
    if (user) {
      getUserFighterProfile().then(setUserProfile);
    }
  }, [user, getUserFighterProfile]);

  // Load user profile separately
  useEffect(() => {
    if (user) {
      getUserFighterProfile().then(setUserProfile);
    }
  }, [user]);

  // Initial load - only once
  useEffect(() => {
    fetchFighters(false);
  }, []);

  // Only reload when toggles change
  useEffect(() => {
    if (readyToFightOnly) {
      fetchFightersWithReadyStatus(includeInactive);
    } else {
      fetchFighters(includeInactive);
    }
  }, [includeInactive, readyToFightOnly]);

  const filteredFighters = fighters
    .filter(fighter => {
      const matchesSearch = 
        fighter.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fighter.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fighter.nickname && fighter.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesWeightClass = 
        selectedWeightClass === 'Todos' || fighter.weight_class === selectedWeightClass;
      
      const matchesDiscipline = 
        selectedDiscipline === 'Todas' || fighter.discipline === selectedDiscipline;
      
      const matchesFightingStyle = 
        selectedFightingStyle === 'Todos' || fighter.fighting_style === selectedFightingStyle;
      
      const matchesRecordType = 
        selectedRecordType === 'Todos' || fighter.record_type === selectedRecordType;
      
      const matchesReadyToFight = 
        !readyToFightOnly || (fighter as any).ready_to_fight === true;
      
      return matchesSearch && matchesWeightClass && matchesDiscipline && 
             matchesFightingStyle && matchesRecordType && matchesReadyToFight;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.first_name.localeCompare(b.first_name);
        case 'wins':
          return b.record_wins - a.record_wins;
        case 'elo':
          return b.elo_rating - a.elo_rating;
        default:
          return 0;
      }
    });

  const handleFighterClick = (fighter: FighterProfile) => {
    // Navigate to public fighter profile instead of dialog
    window.location.href = `/fighter/${fighter.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto p-6 pt-20">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto p-6 pt-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Peleadores</h1>
            <p className="text-muted-foreground">Conoce a los atletas de la plataforma</p>
          </div>
          
          {user && !userProfile && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-neon-primary to-purple-neon-secondary hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4 text-white" />
                  Crear Mi Perfil
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Perfil de Peleador</DialogTitle>
                </DialogHeader>
                <FighterProfileForm
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-6 mb-8">
          {/* Search and Status toggles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar peleadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Incluir inactivos</span>
              <Switch
                checked={includeInactive}
                onCheckedChange={setIncludeInactive}
              />
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Solo listos para pelear</span>
              <Switch
                checked={readyToFightOnly}
                onCheckedChange={setReadyToFightOnly}
              />
            </div>
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select value={selectedWeightClass} onValueChange={setSelectedWeightClass}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="División" />
              </SelectTrigger>
              <SelectContent>
                {WEIGHT_CLASSES.map(weightClass => (
                  <SelectItem key={weightClass} value={weightClass}>
                    {weightClass}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                {DISCIPLINES.map(discipline => (
                  <SelectItem key={discipline} value={discipline}>
                    {discipline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFightingStyle} onValueChange={setSelectedFightingStyle}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Estilo" />
              </SelectTrigger>
              <SelectContent>
                {FIGHTING_STYLES.map(style => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRecordType} onValueChange={setSelectedRecordType}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nombre</SelectItem>
                <SelectItem value="wins">Victorias</SelectItem>
                <SelectItem value="elo">Rating ELO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results summary */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Total: {filteredFighters.length} peleadores</span>
            </div>
            {includeInactive && (
              <Badge variant="secondary" className="text-xs">
                Incluyendo inactivos
              </Badge>
            )}
            {readyToFightOnly && (
              <Badge variant="outline" className="text-xs">
                Solo listos para pelear
              </Badge>
            )}
          </div>
        </div>

        {/* Fighters Grid */}
        {filteredFighters.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No se encontraron peleadores
            </h3>
            <p className="text-muted-foreground">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFighters.map(fighter => (
            <FighterCard
              key={fighter.id}
              fighter={fighter}
              onClick={() => handleFighterClick(fighter)}
            />
          ))}
        </div>
        )}

        {/* Remove the dialog since we now navigate directly to the profile page */}
      </div>
      <Footer />
    </div>
  );
}
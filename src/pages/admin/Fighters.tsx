import { useState } from 'react';
import { Search, Edit, User, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { FighterEditModal } from '@/components/admin/FighterEditModal';
import { DeleteFighterDialog } from '@/components/admin/DeleteFighterDialog';
import { useFighterProfiles, FighterProfile } from '@/hooks/useFighterProfiles';

const WEIGHT_CLASSES = [
  'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight', 
  'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
];

export default function Fighters() {
  const { fighters, loading, error } = useFighterProfiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeightClass, setSelectedWeightClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('elo');
  const [editingFighter, setEditingFighter] = useState<FighterProfile | null>(null);
  const [deletingFighter, setDeletingFighter] = useState<FighterProfile | null>(null);

  // Filtrar y ordenar peleadores
  const filteredFighters = fighters
    .filter(fighter => {
      const matchesSearch = `${fighter.first_name} ${fighter.last_name} ${fighter.nickname || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesWeight = selectedWeightClass === 'all' || fighter.weight_class === selectedWeightClass;
      return matchesSearch && matchesWeight;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'weight':
          return (a.weight_kg || 0) - (b.weight_kg || 0);
        case 'record':
          return (b.record_wins - b.record_losses) - (a.record_wins - a.record_losses);
        case 'elo':
        default:
          return b.elo_rating - a.elo_rating;
      }
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Gestión de Peleadores</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-muted rounded-full mb-4 mx-auto"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Gestión de Peleadores</h1>
        <p className="text-muted-foreground">
          Administra los perfiles de todos los peleadores registrados
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar peleadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedWeightClass} onValueChange={setSelectedWeightClass}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {WEIGHT_CLASSES.map(weightClass => (
                  <SelectItem key={weightClass} value={weightClass}>
                    {weightClass}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elo">ELO Rating</SelectItem>
                <SelectItem value="name">Nombre</SelectItem>
                <SelectItem value="weight">Peso</SelectItem>
                <SelectItem value="record">Récord</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredFighters.length} de {fighters.length} peleadores
      </div>

      {/* Fighters Grid */}
      {filteredFighters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No se encontraron peleadores</p>
            <p className="text-muted-foreground">
              Ajusta los filtros de búsqueda para encontrar peleadores
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFighters.map((fighter) => (
            <Card key={fighter.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <OptimizedImage
                      src={fighter.avatar_url || ''}
                      alt={`${fighter.first_name} ${fighter.last_name}`}
                      className="w-12 h-12 rounded-full border-2 border-border object-cover"
                      fallbackIcon={
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      }
                      priority={false}
                    />
                    <div>
                      <CardTitle className="text-lg">
                        {fighter.first_name} {fighter.last_name}
                      </CardTitle>
                      {fighter.nickname && (
                        <p className="text-sm text-muted-foreground">"{fighter.nickname}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingFighter(fighter)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingFighter(fighter)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Récord:</span>
                    <Badge variant="secondary">
                      {fighter.record_wins}-{fighter.record_losses}-{fighter.record_draws}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ELO:</span>
                    <Badge variant="outline">{fighter.elo_rating}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Categoría:</span>
                    <span className="text-sm font-medium">{fighter.weight_class}</span>
                  </div>
                  
                  {fighter.discipline && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Disciplina:</span>
                      <Badge variant="outline" className="text-xs">
                        {fighter.discipline.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  
                  {fighter.country && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">País:</span>
                      <span className="text-sm">{fighter.country}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <Badge variant={fighter.active ? "default" : "secondary"}>
                      {fighter.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingFighter && (
        <FighterEditModal
          fighter={editingFighter}
          open={!!editingFighter}
          onClose={() => setEditingFighter(null)}
        />
      )}

      {/* Delete Dialog */}
      <DeleteFighterDialog
        fighter={deletingFighter}
        isOpen={!!deletingFighter}
        onClose={() => setDeletingFighter(null)}
        onConfirm={() => {
          // Refresh will be handled by the dialog's onConfirm
          setDeletingFighter(null);
        }}
      />
    </div>
  );
}
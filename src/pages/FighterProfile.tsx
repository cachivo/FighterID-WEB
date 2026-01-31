import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useFighterProfiles, FighterProfile as FighterProfileType } from '@/hooks/useFighterProfiles';
import { RecordType } from '@/hooks/useFighterHistory';
import { useCombinedFighterRecord } from '@/hooks/useCombinedFighterRecord';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Shield, Trophy, MapPin, Users, BarChart3, Info, Home, GraduationCap } from 'lucide-react';
import FighterUpdatesFeed from '@/components/FighterUpdatesFeed';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getWeightClassLabel } from '@/lib/constants/disciplines';

export default function FighterProfile() {
  const { id } = useParams<{ id: string }>();
  const { getFighterById } = useFighterProfiles();
  const { calculateCombinedRecord, isLoading: isLoadingRecord } = useCombinedFighterRecord(id || null);
  const [fighter, setFighter] = useState<FighterProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordType, setRecordType] = useState<RecordType>('AMATEUR');

  useEffect(() => {
    if (id) {
      getFighterById(id).then((profile) => {
        setFighter(profile);
        setLoading(false);
      });
    }
  }, [id, getFighterById]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <h2 className="text-xl font-semibold">Cargando perfil del peleador...</h2>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!fighter) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Peleador no encontrado</h2>
            <p className="text-muted-foreground mb-4">El perfil que buscas no existe o no está disponible.</p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Inicio
                </Link>
              </Button>
              <Button asChild>
                <Link to="/fighters">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Fighters
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'suspended': return 'bg-red-500 text-white';
      case 'expired': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Calculate record based on selected type
  const currentRecord = calculateCombinedRecord(recordType);
  const record = `${currentRecord.wins}-${currentRecord.losses}-${currentRecord.draws}`;
  const winPercentage = currentRecord.winPercentage;

  // Record source indicator
  const getRecordSourceText = () => {
    switch (currentRecord.source) {
      case 'manual': return 'Récord oficial';
      case 'fights': return 'Desde peleas';
      case 'combined': return 'Récord combinado';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Header */}
      <div className="border-b border-border pt-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/fighters">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Fighters
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Fighter Header */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Fighter Info */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getStatusColor(fighter.license_status)}>
                    {fighter.license_status === 'active' ? 'Activo' : fighter.license_status}
                  </Badge>
                  <Badge variant="outline">{getWeightClassLabel(fighter.weight_class)}</Badge>
                </div>
                
                {fighter.nickname && (
                  <p className="text-lg font-medium text-muted-foreground">
                    "{fighter.nickname}"
                  </p>
                )}
                
                <div>
                  <h1 className="text-4xl lg:text-6xl font-bold text-foreground">
                    {fighter.first_name} {fighter.last_name}
                  </h1>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{fighter.country}</span>
                </div>

                {/* Record Type Toggle */}
                <div className="my-6">
                  <Tabs value={recordType} onValueChange={(value) => setRecordType(value as RecordType)}>
                    <TabsList className="w-full">
                      <TabsTrigger value="AMATEUR" className="flex-1">
                        Amateur
                      </TabsTrigger>
                      <TabsTrigger value="PROFESSIONAL" className="flex-1">
                        Profesional
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Fight Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {currentRecord.wins}
                    </div>
                    <div className="text-sm text-muted-foreground">Victorias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-1">
                      {currentRecord.losses}
                    </div>
                    <div className="text-sm text-muted-foreground">Derrotas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground mb-1">
                      {currentRecord.draws}
                    </div>
                    <div className="text-sm text-muted-foreground">Empates</div>
                  </div>
                </div>

                {/* Record Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-green-600" />
                    {winPercentage}% Victorias
                  </div>
                  {currentRecord.source && (
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {getRecordSourceText()}
                    </div>
                  )}
                </div>
              </div>

              {/* Fighter Image */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {fighter.avatar_url ? (
                    <div className="h-80 w-60 flex items-end justify-center overflow-hidden rounded-xl bg-muted">
                      <img 
                        src={fighter.avatar_url} 
                        alt={`${fighter.first_name} ${fighter.last_name}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-80 w-60 bg-muted rounded-xl flex items-center justify-center">
                      <div className="text-6xl font-bold text-muted-foreground">
                        {fighter.first_name?.charAt(0) || 'F'}
                        {fighter.last_name?.charAt(0) || 'F'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Altura', value: fighter.height_cm ? `${fighter.height_cm} cm` : 'N/A', icon: BarChart3 },
            { label: 'Peso', value: fighter.weight_kg ? `${fighter.weight_kg} kg` : 'N/A', icon: BarChart3 },
            { label: 'Alcance', value: fighter.reach_cm ? `${fighter.reach_cm} cm` : 'N/A', icon: BarChart3 },
            { label: 'Stance', value: fighter.stance || 'N/A', icon: Users }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <div className="p-2 rounded-full bg-primary/10 w-fit mx-auto mb-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground uppercase mb-1">{stat.label}</p>
                <p className="text-lg font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fighter Updates Feed - Prominently placed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Actividad del Peleador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FighterUpdatesFeed fighterId={fighter.id} />
          </CardContent>
        </Card>

        {/* Fighter Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Biography */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Perfil del Peleador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fighter.bio ? (
                  <div>
                    <h4 className="font-semibold mb-2">Biografía</h4>
                    <p className="text-muted-foreground leading-relaxed">{fighter.bio}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay información biográfica disponible</p>
                  </div>
                )}

                <Separator />

                {/* Martial Arts */}
                <div>
                  <h4 className="font-semibold mb-2">Disciplinas</h4>
                  <div className="flex flex-wrap gap-2">
                    {fighter.martial_arts && fighter.martial_arts.length > 0 ? (
                      fighter.martial_arts.map((art) => (
                        <Badge key={art} variant="outline">{art}</Badge>
                      ))
                    ) : (
                      <Badge variant="outline">{fighter.discipline || 'N/A'}</Badge>
                    )}
                  </div>
                </div>

                {/* Fighting Style */}
                {fighter.fighting_style && (
                  <div>
                    <h4 className="font-semibold mb-2">Estilo de Pelea</h4>
                    <p className="text-muted-foreground">{fighter.fighting_style}</p>
                  </div>
                )}

                {/* Gym */}
                {fighter.gym_name && (
                  <div>
                    <h4 className="font-semibold mb-2">Gimnasio</h4>
                    <p className="text-muted-foreground">{fighter.gym_name}</p>
                  </div>
                )}

                {/* Coach */}
                {fighter.coach && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Entrenador
                    </h4>
                    <Link 
                      to={`/entrenadores/${fighter.coach.slug}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={fighter.coach.avatar_url} alt={fighter.coach.nombre} />
                        <AvatarFallback>
                          {fighter.coach.nombre?.charAt(0) || 'E'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {fighter.coach.nombre} {fighter.coach.apellidos || ''}
                        </p>
                        {fighter.coach.especialidades && fighter.coach.especialidades.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {fighter.coach.especialidades.slice(0, 3).map((esp) => (
                              <Badge key={esp} variant="secondary" className="text-xs">
                                {esp}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="space-y-6">
            {/* Record Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Récord {recordType}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold">{record}</div>
                  <p className="text-sm text-muted-foreground">
                    {currentRecord.totalFights} peleas totales
                  </p>
                  <div className="text-sm">
                    <span className="text-green-600">{winPercentage}%</span> de victorias
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Estado de Licencia</p>
                  <Badge className={getStatusColor(fighter.license_status)}>
                    {fighter.license_status === 'active' ? 'Activo' : fighter.license_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
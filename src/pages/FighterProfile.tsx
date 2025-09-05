import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useFighterProfiles, FighterProfile as FighterProfileType } from '@/hooks/useFighterProfiles';
import { useFighterHistory, RecordType } from '@/hooks/useFighterHistory';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Shield, Trophy, Calendar, MapPin, Users, BarChart3, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import UrbanDecorations from '@/components/UrbanDecorations';

export default function FighterProfile() {
  const { id } = useParams<{ id: string }>();
  const { getFighterById } = useFighterProfiles();
  const { calculateRecord } = useFighterHistory(id || null);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-professional-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2 text-white">Cargando perfil...</h2>
          <p className="text-gray-400">Por favor espera mientras cargamos la información del peleador</p>
        </div>
      </div>
    );
  }

  if (!fighter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Peleador no encontrado</h2>
          <p className="text-gray-400 mb-6">El perfil que buscas no existe o no está disponible.</p>
          <Button asChild>
            <Link to="/fighters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Fighters
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-fighter-success text-white';
      case 'suspended': return 'bg-fighter-danger text-white';
      case 'expired': return 'bg-fighter-info text-white';
      case 'pending': return 'bg-fighter-warning text-black';
      default: return 'bg-fighter-info text-white';
    }
  };

  // Calculate record based on selected type
  const currentRecord = calculateRecord(recordType);
  const record = `${currentRecord.wins}-${currentRecord.losses}-${currentRecord.draws}`;
  const winPercentage = currentRecord.winPercentage;

  return (
    <div className="min-h-screen bg-black">
      <UrbanDecorations />
      {/* Header Navigation */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button variant="ghost" asChild className="hover:bg-purple-500/20">
            <Link to="/fighters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Fighters
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Hero Section - UFC Style */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 via-transparent to-purple-400/5"></div>
            <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          
          {/* Professional accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          
          <div className="relative p-8 lg:p-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Fighter Info */}
                <div className="space-y-8 animate-fade-in">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3 mb-4">
                      <Badge className={`${getStatusColor(fighter.license_status)} border-0 font-medium px-4 py-2 text-sm uppercase tracking-wider`}>
                        {fighter.license_status === 'active' ? 'Activo' : fighter.license_status}
                      </Badge>
                      <Badge variant="outline" className="border-2 border-professional-accent/40 text-professional-primary px-4 py-2 text-sm font-medium">
                        {fighter.weight_class}
                      </Badge>
                    </div>
                    
                    {fighter.nickname && (
                      <p className="text-xl lg:text-2xl font-medium text-professional-accent uppercase tracking-wider">
                        "{fighter.nickname}"
                      </p>
                    )}
                    
                    <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight">
                      {fighter.first_name}
                    </h1>
                    <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight -mt-4">
                      {fighter.last_name}
                    </h1>
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="h-5 w-5" />
                      <span className="text-lg font-medium">{fighter.country}</span>
                    </div>
                  </div>

                  {/* Record Type Toggle */}
                  <div className="mb-6">
                    <Tabs value={recordType} onValueChange={(value) => setRecordType(value as RecordType)}>
                      <TabsList className="bg-gray-900/90 border border-purple-500/30 w-full shadow-lg shadow-purple-500/20">
                        <TabsTrigger 
                          value="AMATEUR" 
                          className="flex-1 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 bg-transparent text-gray-300 hover:bg-purple-500/20 transition-all duration-300"
                        >
                          Amateur
                        </TabsTrigger>
                        <TabsTrigger 
                          value="PROFESSIONAL" 
                          className="flex-1 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 bg-transparent text-gray-300 hover:bg-purple-500/20 transition-all duration-300"
                        >
                          Profesional
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Fight Stats */}
                  <div className="grid grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="text-4xl lg:text-6xl font-bold text-purple-400 font-mono mb-2 drop-shadow-lg">
                        {currentRecord.wins}
                      </div>
                      <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Victorias
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl lg:text-6xl font-bold text-red-400 font-mono mb-2 drop-shadow-lg">
                        {currentRecord.losses}
                      </div>
                      <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Derrotas
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl lg:text-6xl font-bold text-yellow-400 font-mono mb-2 drop-shadow-lg">
                        {currentRecord.draws}
                      </div>
                      <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Empates
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-300">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-fighter-success" />
                      {winPercentage}% Victorias
                    </span>
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-professional-accent" />
                      ELO: {fighter.elo_rating || 1200}
                    </span>
                  </div>
                </div>

                {/* Fighter Image */}
                <div className="flex justify-center lg:justify-end animate-scale-in">
                  <div className="relative">
                    {fighter.avatar_url ? (
                      <div className="relative">
                        {/* Background glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-professional-primary/30 via-professional-accent/20 to-transparent rounded-3xl blur-2xl scale-110"></div>
                        
                        {/* Fighter image container */}
                        <div className="relative h-96 lg:h-[500px] w-64 lg:w-80 flex items-end justify-center">
                          <img 
                            src={fighter.avatar_url} 
                            alt={`${fighter.first_name} ${fighter.last_name}`}
                            className="h-full w-full object-contain drop-shadow-2xl hover-scale transition-all duration-500"
                            style={{
                              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4)) drop-shadow(0 0 20px rgba(var(--professional-primary), 0.2))'
                            }}
                          />
                        </div>
                        
                        {/* Subtle accent elements */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-gradient-professional rounded-full opacity-60"></div>
                      </div>
                    ) : (
                      <div className="h-96 lg:h-[500px] w-64 lg:w-80 bg-gradient-professional rounded-3xl flex items-center justify-center shadow-professional">
                        <div className="text-8xl font-bold text-professional-primary-foreground">
                          {fighter.first_name?.charAt(0) || 'F'}
                          {fighter.last_name?.charAt(0) || 'F'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fighter Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          {[
            { 
              label: 'Altura', 
              value: fighter.height_cm ? `${fighter.height_cm} cm` : 'N/A',
              icon: BarChart3
            },
            { 
              label: 'Peso', 
              value: fighter.weight_kg ? `${fighter.weight_kg} kg` : 'N/A',
              icon: BarChart3
            },
            { 
              label: 'Alcance', 
              value: fighter.reach_cm ? `${fighter.reach_cm} cm` : 'N/A',
              icon: BarChart3
            },
            { 
              label: 'Stance', 
              value: fighter.stance || 'N/A',
              icon: Users
            }
          ].map((stat, index) => (
            <Card key={index} className="border border-professional-border/30 bg-gradient-professional-light shadow-professional hover:shadow-professional-light transition-all duration-300 hover-scale">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-full bg-professional-accent/20 w-fit mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-professional-primary" />
                </div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fighter Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          {/* Bio & Background */}
          <div className="lg:col-span-2">
            <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-lg bg-professional-accent/20">
                    <Users className="h-6 w-6 text-professional-primary" />
                  </div>
                  Perfil del Peleador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {fighter.bio && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-professional-primary">Biografía</h3>
                    <p className="text-gray-300 leading-relaxed">{fighter.bio}</p>
                  </div>
                )}
                
                <Separator className="bg-gradient-to-r from-transparent via-professional-accent/40 to-transparent" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-professional-primary">Disciplinas</h3>
                    <div className="flex flex-wrap gap-2">
                      {fighter.martial_arts && fighter.martial_arts.length > 0 ? (
                        fighter.martial_arts.map((art) => (
                          <Badge key={art} variant="outline" className="border-professional-accent/40 text-professional-primary">
                            {art}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="border-professional-accent/40 text-professional-primary">
                          {fighter.discipline || 'N/A'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-professional-primary">Estilo de Pelea</h3>
                    <p className="text-gray-300">{fighter.fighting_style || 'No especificado'}</p>
                  </div>
                </div>

                {fighter.gym_name && (
                  <>
                    <Separator className="bg-gradient-to-r from-transparent via-professional-accent/40 to-transparent" />
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-professional-primary">Gimnasio</h3>
                      <p className="text-gray-300">{fighter.gym_name}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats & Links */}
          <div className="space-y-6">
            {/* License Info */}
            <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-professional-accent/20">
                    <Shield className="h-5 w-5 text-professional-primary" />
                  </div>
                  Licencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fighter.license_number && (
                  <div className="p-3 rounded-lg bg-background/50 border border-professional-border/30">
                    <p className="text-sm font-medium text-professional-accent uppercase tracking-wide">Número</p>
                    <p className="font-mono font-bold text-white mt-1">{fighter.license_number}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-400">Estado</span>
                  <Badge className={`${getStatusColor(fighter.license_status)} border-0 font-medium`}>
                    {fighter.license_status === 'active' ? 'Activa' : fighter.license_status}
                  </Badge>
                </div>
                {fighter.level && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Nivel</span>
                    <Badge variant="outline" className="border-professional-accent/40 text-professional-primary">
                      {fighter.level}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External Links */}
            {(fighter.sherdog_url || fighter.tapology_url) && (
              <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-professional-accent/20">
                      <ExternalLink className="h-5 w-5 text-professional-primary" />
                    </div>
                    Enlaces
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fighter.sherdog_url && (
                    <Button variant="outline" asChild className="w-full border-professional-accent/40 hover:bg-professional-accent/10">
                      <a href={fighter.sherdog_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver en Sherdog
                      </a>
                    </Button>
                  )}
                  {fighter.tapology_url && (
                    <Button variant="outline" asChild className="w-full border-professional-accent/40 hover:bg-professional-accent/10">
                      <a href={fighter.tapology_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver en Tapology
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
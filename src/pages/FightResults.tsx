import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Calendar, MapPin, Users } from 'lucide-react';
import { Zap, Flame, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

export default function FightResults() {
  const [fights, setFights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from('fights')
      .select(`
        *,
        fighterA:fighter_profiles!fighter_a_id(first_name, last_name, nickname, avatar_url),
        fighterB:fighter_profiles!fighter_b_id(first_name, last_name, nickname, avatar_url),
        winner:fighter_profiles!winner_id(first_name, last_name),
        event:bdg_event(name, start_time, venue),
        fight_results(*),
        fight_summaries(summary_md, highlights, key_moments)
      `)
      .eq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching results:', error);
    } else {
      setFights(data || []);
    }
    setLoading(false);
  };

  const getResultBadgeVariant = (resultType: string) => {
    switch (resultType) {
      case 'KO':
      case 'TKO':
        return 'destructive';
      case 'SUBMISSION':
        return 'secondary';
      case 'DECISION':
        return 'default';
      case 'DRAW':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Resultados de Peleas
          </h1>
          <p className="text-lg text-muted-foreground">
            Resultados oficiales y resúmenes generados por IA
          </p>
        </div>

        {/* Results List */}
        <div className="space-y-8">
          {fights.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay resultados disponibles</h3>
                <p className="text-muted-foreground">
                  Los resultados de las peleas aparecerán aquí una vez finalizadas
                </p>
              </CardContent>
            </Card>
          ) : (
            fights.map((fight) => {
              const result = fight.fight_results?.[0];
              const summary = fight.fight_summaries?.[0];

              return (
                <Card key={fight.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono">
                            #{fight.fight_number}
                          </Badge>
                          {result && (
                            <Badge variant={getResultBadgeVariant(result.result_type)}>
                              {result.result_type}
                            </Badge>
                          )}
                          {result?.finish_method && (
                            <Badge variant="secondary">{result.finish_method}</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {fight.event?.start_time && new Date(fight.event.start_time).toLocaleDateString('es-HN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>

                        {fight.event?.venue && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {fight.event.venue}
                          </div>
                        )}
                      </div>

                      {fight.winner && (
                        <Badge className="text-sm px-4 py-2">
                          <Trophy className="mr-2 h-4 w-4" />
                          Ganador: {fight.winner.first_name} {fight.winner.last_name}
                        </Badge>
                      )}
                    </div>

                    <CardTitle className="text-2xl mt-4">
                      <div className="flex items-center justify-center gap-4">
                        <div
                          className={`text-right flex-1 ${
                            fight.winner_id === fight.fighter_a_id ? 'text-primary font-bold' : ''
                          }`}
                        >
                          {fight.fighterA?.first_name} {fight.fighterA?.last_name}
                          {fight.fighterA?.nickname && (
                            <span className="text-sm text-muted-foreground ml-2">
                              "{fight.fighterA.nickname}"
                            </span>
                          )}
                        </div>
                        
                        <Users className="h-6 w-6 text-muted-foreground shrink-0" />
                        
                        <div
                          className={`text-left flex-1 ${
                            fight.winner_id === fight.fighter_b_id ? 'text-primary font-bold' : ''
                          }`}
                        >
                          {fight.fighterB?.first_name} {fight.fighterB?.last_name}
                          {fight.fighterB?.nickname && (
                            <span className="text-sm text-muted-foreground ml-2">
                              "{fight.fighterB.nickname}"
                            </span>
                          )}
                        </div>
                      </div>
                    </CardTitle>

                    <CardDescription className="text-center">
                      {fight.event?.name} • {fight.weight_class} • {fight.fight_type}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {/* AI Summary */}
                    {summary?.summary_md && (
                      <div className="prose dark:prose-invert max-w-none mb-6">
                        <ReactMarkdown>{summary.summary_md}</ReactMarkdown>
                      </div>
                    )}

                    {/* Highlights */}
                    {summary?.highlights && summary.highlights.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {summary.highlights.map((highlight: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Separator className="my-4" />

                    {/* Result Details */}
                    {result && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-muted-foreground mb-1">Método</p>
                          <p className="font-semibold">{result.result_type}</p>
                          {result.finish_method && (
                            <p className="text-xs text-muted-foreground mt-1">{result.finish_method}</p>
                          )}
                        </div>

                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-muted-foreground mb-1">Round</p>
                          <p className="font-semibold">Round {result.finish_round}</p>
                        </div>

                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-muted-foreground mb-1">Tiempo</p>
                          <p className="font-semibold">{result.finish_time}</p>
                        </div>
                      </div>
                    )}

                    {/* Scorecards for Decisions */}
                    {result?.result_type === 'DECISION' && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Juez 1</p>
                          <p className="text-lg font-bold">{result.judge_1_total}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.judge_1_scorecard?.join('-') || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Juez 2</p>
                          <p className="text-lg font-bold">{result.judge_2_total}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.judge_2_scorecard?.join('-') || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Juez 3</p>
                          <p className="text-lg font-bold">{result.judge_3_total}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.judge_3_scorecard?.join('-') || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Bonuses */}
                    {(result?.performance_bonus || result?.fight_of_night) && (
                      <>
                        <Separator className="my-4" />
                        <div className="flex gap-2 justify-center">
                          {result.performance_bonus && (
                            <Badge variant="secondary" className="text-sm px-4 py-2 flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              Bono de Actuación
                            </Badge>
                          )}
                          {result.fight_of_night && (
                            <Badge variant="secondary" className="text-sm px-4 py-2 flex items-center gap-1">
                              <Flame className="h-4 w-4" />
                              Pelea de la Noche
                            </Badge>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

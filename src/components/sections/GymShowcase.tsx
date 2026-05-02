import { useGymsWithFighters } from "@/hooks/useGymsWithFighters";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";
import { SectionDivider } from "@/components/landing/SectionDivider";

const GymShowcase = () => {
  const { data: gyms, isLoading } = useGymsWithFighters();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <>
        <SectionDivider title="Escuelas de Combate" subtitle="Gimnasios y sus peleadores registrados" />
        <section className="py-6 sm:py-8">
          <div className="container mx-auto px-3 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <EnhancedSkeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <EnhancedSkeleton className="h-4 w-28 mb-1.5" />
                      <EnhancedSkeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </>
    );
  }

  if (!gyms || gyms.length === 0) return null;

  return (
    <>
      <SectionDivider title="Escuelas de Combate" subtitle="Gimnasios y sus peleadores registrados" />
      <section className="py-6 sm:py-8">
        <div className="container mx-auto px-3">

        <div className="space-y-3">
          {gyms.map((gym) => (
            <Card
              key={gym.id}
              className="bg-card border-primary/20 backdrop-blur-sm cursor-pointer touch-manipulation active:scale-[0.98] transition-transform"
              onClick={() => navigate(`/gimnasios/${gym.slug}`)}
            >
              <CardContent className="p-3">
                {/* Gym header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 overflow-hidden grayscale-hover">
                    {gym.logo_url ? (
                      <img src={gym.logo_url} alt={gym.nombre} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{gym.nombre}</h3>
                    <div className="flex items-center gap-2">
                      {gym.ciudad && (
                        <span className="text-[10px] text-muted-foreground truncate">{gym.ciudad}</span>
                      )}
                      <span className="text-[10px] text-primary flex items-center gap-0.5">
                        <Users className="h-2.5 w-2.5" />
                        {gym.fighter_count}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>

                {/* Fighter avatars row */}
                {gym.fighters.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-[52px]">
                    {gym.fighters.map((f) => (
                      <Avatar key={f.id} className="h-6 w-6 border border-primary/30">
                        <AvatarImage src={f.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-[8px] text-foreground">
                          {f.first_name[0]}{f.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {gym.fighter_count > 5 && (
                      <span className="text-[9px] text-muted-foreground ml-1">+{gym.fighter_count - 5}</span>
                    )}
                  </div>
                )}

                {/* Disciplines */}
                {gym.disciplinas.length > 0 && (
                  <div className="flex gap-1 mt-2 ml-[52px]">
                    {gym.disciplinas.slice(0, 3).map((d) => (
                      <Badge key={d} variant="outline" className="text-[8px] px-1 py-0 border-primary/30 text-primary">
                        {d}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GymShowcase;
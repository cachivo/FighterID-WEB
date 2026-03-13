import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, Calendar, Tag, RefreshCw } from "lucide-react";
import { useSportsNews } from "@/hooks/useSportsNews";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { supabase } from "@/integrations/supabase/client";

const SportsNewsCarousel = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { news, featuredNews, isLoading, refetch } = useSportsNews(selectedCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categories = [
    { id: "all", name: "Todas", color: "bg-primary" },
    { id: "mma", name: "MMA", color: "bg-destructive" },
    { id: "boxing", name: "Boxeo", color: "bg-fighter-info" },
    { id: "muay_thai", name: "Muay Thai", color: "bg-fighter-warning" },
    { id: "kickboxing", name: "Kickboxing", color: "bg-fighter-success" }
  ];

  const displayNews = featuredNews.length > 0 ? featuredNews : news.slice(0, 6);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayNews.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayNews.length) % displayNews.length);
  };

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || displayNews.length <= 1) return;
    
    const interval = setInterval(nextSlide, 8000); // Change slide every 8 seconds
    return () => clearInterval(interval);
  }, [isAutoPlaying, displayNews.length, currentIndex]);

  // Auto-refresh news every 10 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing sports news...');
      handleAutoRefresh();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  // Manual refresh trigger
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger the edge function to fetch new RSS data
      await supabase.functions.invoke('fetch-sports-news');
      // Then refetch the local data
      await refetch();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing news:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto refresh (silent)
  const handleAutoRefresh = async () => {
    try {
      await supabase.functions.invoke('fetch-sports-news');
      await refetch();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error auto-refreshing news:', error);
    }
  };

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Hace menos de 1 hora";
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    return `Hace ${Math.floor(diffHours / 24)} días`;
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || "bg-gray-600";
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-urban-gray to-black">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <EnhancedSkeleton variant="stat" className="h-10 w-64 mx-auto mb-4" />
            <EnhancedSkeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <EnhancedSkeleton key={i} className="h-10 w-20 rounded-full" />
            ))}
          </div>
          <div className="relative">
            <EnhancedSkeleton variant="card" className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (!news || news.length === 0) {
    return null; // Don't render if no news
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-urban-gray to-black">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4 neon-text">
            Noticias del Mundo del Combate
          </h2>
          <p className="text-urban-gray-light max-w-2xl mx-auto mb-4">
            Mantente al día con las últimas noticias de MMA, boxeo y artes marciales
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-urban-gray-light border-urban-gray-light">
              Actualizado: {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="text-urban-gray-light hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={`transition-all duration-200 ${
                selectedCategory === category.id
                  ? "bg-primary text-black shadow-neon"
                  : "border-urban-gray-light text-urban-gray-light hover:bg-primary/20"
              }`}
            >
              <Tag className="w-3 h-3 mr-1" />
              {category.name}
            </Button>
          ))}
        </div>

        {/* News Carousel */}
        {displayNews.length > 0 && (
          <div className="relative max-w-5xl mx-auto">
            <Card className="bg-urban-gray/90 backdrop-blur border-purple-neon-primary/20 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                <div 
                  className="relative"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Navigation Buttons */}
                  {displayNews.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white border border-purple-neon-primary/30 hover:shadow-neon"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white border border-purple-neon-primary/30 hover:shadow-neon"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </>
                  )}

                  {/* Main News Display */}
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image Section */}
                    <div className="relative h-80 md:h-96">
                      <OptimizedImage
                        src={displayNews[currentIndex]?.image_url || "/placeholder.svg"}
                        alt={displayNews[currentIndex]?.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <Badge 
                        className={`absolute top-4 left-4 ${getCategoryColor(displayNews[currentIndex]?.category)} text-white border-0`}
                      >
                        {displayNews[currentIndex]?.category?.toUpperCase()}
                      </Badge>
                      {displayNews[currentIndex]?.is_featured && (
                        <Badge className="absolute top-4 right-4 bg-yellow-500/90 text-black border-0">
                          Destacado
                        </Badge>
                      )}
                      {new Date(displayNews[currentIndex]?.published_at) > new Date(Date.now() - 6 * 60 * 60 * 1000) && (
                        <Badge className="absolute top-16 left-4 bg-green-500/90 text-black border-0 animate-pulse">
                          Nuevo
                        </Badge>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-urban-gray-light text-sm mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(displayNews[currentIndex]?.published_at)}</span>
                        <span className="mx-2">•</span>
                        <span className="font-medium">{displayNews[currentIndex]?.source}</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                        {displayNews[currentIndex]?.title}
                      </h3>
                      
                      <p className="text-urban-gray-light mb-6 leading-relaxed">
                        {displayNews[currentIndex]?.description}
                      </p>
                      
                      <Button
                        asChild
                        variant="outline"
                        className="self-start border-purple-neon-primary text-purple-neon-primary hover:bg-purple-neon-primary hover:text-black transition-all duration-200"
                      >
                        <a 
                          href={displayNews[currentIndex]?.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2"
                        >
                          Leer más
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dots Indicator */}
            {displayNews.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {displayNews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentIndex
                        ? "bg-purple-neon-primary shadow-neon"
                        : "bg-urban-gray-light hover:bg-purple-neon-primary/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SportsNewsCarousel;
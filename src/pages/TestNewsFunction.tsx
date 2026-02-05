import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TestNewsFunction = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const fetchNews = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-sports-news');
      
      if (error) throw error;
      
      setResult(data);
      toast({
        title: "Noticias actualizadas",
        description: `${data.inserted} nuevas noticias insertadas, ${data.socialPosts} posts creados`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Error al obtener noticias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Test News Function</h1>
        <Button onClick={fetchNews} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Obteniendo noticias...
            </>
          ) : (
            'Fetch Sports News Now'
          )}
        </Button>
        
        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Resultado:</h2>
            <pre className="bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TestNewsFunction;

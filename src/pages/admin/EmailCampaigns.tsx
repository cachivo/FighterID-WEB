import { useEffect, useState } from 'react';
import AdminLayoutWithAI from '@/components/admin/AIAssistant/AdminLayoutWithAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, CheckCircle2, XCircle, TestTube2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface EmailCampaign {
  id: string;
  sent_by: string;
  subject: string;
  recipient_filter: string;
  total_sent: number;
  total_failed: number;
  test_mode: boolean;
  created_at: string;
}

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaign_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  };

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'all': return 'Todos los usuarios';
      case 'fighters_only': return 'Solo peleadores';
      case 'admins_only': return 'Solo administradores';
      default: return filter;
    }
  };

  return (
    <AdminLayoutWithAI>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Campañas de Email Recientes
          </CardTitle>
          <CardDescription>
            Historial de correos masivos enviados desde la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay campañas de correo registradas
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{campaign.subject}</h3>
                        {campaign.test_mode && (
                          <Badge variant="outline" className="text-xs">
                            <TestTube2 className="h-3 w-3 mr-1" />
                            Prueba
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(campaign.created_at), {
                            addSuffix: true,
                            locale: es
                          })}
                        </span>
                        <span>•</span>
                        <span>{getFilterLabel(campaign.recipient_filter)}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">{campaign.total_sent}</span>
                      </div>
                      {campaign.total_failed > 0 && (
                        <div className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-4 w-4" />
                          <span className="font-medium">{campaign.total_failed}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayoutWithAI>
  );
}

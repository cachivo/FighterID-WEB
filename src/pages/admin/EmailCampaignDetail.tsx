import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayoutWithAI from '@/components/admin/AIAssistant/AdminLayoutWithAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Search,
  Download,
  Eye,
  Clock,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailCampaign {
  id: string;
  sent_by: string;
  subject: string;
  html_content: string;
  recipient_filter: string;
  total_sent: number;
  total_failed: number;
  test_mode: boolean;
  created_at: string;
  metadata: any;
}

interface EmailSend {
  id: string;
  recipient_email: string;
  status: string;
  resend_id: string | null;
  error_message: string | null;
  bounce_type: string | null;
  created_at: string;
}

export default function EmailCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [filteredSends, setFilteredSends] = useState<EmailSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCampaignData();
    }
  }, [id]);

  useEffect(() => {
    filterSends();
  }, [sends, searchTerm, statusFilter]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('email_campaign_log')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch individual sends
      const { data: sendsData, error: sendsError } = await supabase
        .from('email_sends')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: true });

      if (sendsError) throw sendsError;
      setSends(sendsData || []);
      
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Error al cargar la campaña');
    } finally {
      setLoading(false);
    }
  };

  const filterSends = () => {
    let filtered = [...sends];
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    setFilteredSends(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fallido</Badge>;
      case 'bounced':
        return <Badge variant="outline" className="text-orange-500 border-orange-500"><AlertTriangle className="h-3 w-3 mr-1" />Rebotado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'all': return 'Todos los usuarios';
      case 'fighters_only': return 'Solo peleadores';
      case 'admins_only': return 'Solo administradores';
      case 'custom': return 'Selección manual';
      default: return filter;
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Estado', 'Resend ID', 'Error', 'Fecha'];
    const rows = filteredSends.map(s => [
      s.recipient_email,
      s.status,
      s.resend_id || '',
      s.error_message || '',
      format(new Date(s.created_at), 'yyyy-MM-dd HH:mm:ss')
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-${id}-${statusFilter}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Archivo CSV exportado');
  };

  const statusCounts = {
    sent: sends.filter(s => s.status === 'sent' || s.status === 'delivered').length,
    failed: sends.filter(s => s.status === 'failed').length,
    bounced: sends.filter(s => s.status === 'bounced').length,
  };

  if (loading) {
    return (
      <AdminLayoutWithAI>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayoutWithAI>
    );
  }

  if (!campaign) {
    return (
      <AdminLayoutWithAI>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Campaña no encontrada</h2>
          <Button variant="outline" onClick={() => navigate('/admin/email-campaigns')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a campañas
          </Button>
        </div>
      </AdminLayoutWithAI>
    );
  }

  return (
    <AdminLayoutWithAI>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/email-campaigns')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{campaign.subject}</h1>
              {campaign.test_mode && (
                <Badge variant="outline">Prueba</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true, locale: es })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {getFilterLabel(campaign.recipient_filter)}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Ver contenido
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{sends.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{statusCounts.sent}</div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                Fallidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{statusCounts.failed}</div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Rebotados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{statusCounts.bounced}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Detalle de Envíos
                </CardTitle>
                <CardDescription>
                  {filteredSends.length} de {sends.length} registros
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="sent">Enviados</SelectItem>
                    <SelectItem value="failed">Fallidos</SelectItem>
                    <SelectItem value="bounced">Rebotados</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sends.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay registros de envíos individuales para esta campaña.</p>
                <p className="text-sm mt-2">
                  Esto puede deberse a que la campaña se envió antes de implementar el tracking individual.
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Resend ID</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSends.map((send) => (
                      <TableRow key={send.id}>
                        <TableCell className="font-medium">{send.recipient_email}</TableCell>
                        <TableCell>{getStatusBadge(send.status)}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {send.resend_id || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-red-600 max-w-xs truncate">
                          {send.error_message || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(send.created_at), 'dd MMM HH:mm', { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Contenido del Email</DialogTitle>
            </DialogHeader>
            <div 
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: campaign.html_content }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayoutWithAI>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MessageSquare, X, Send, Bot, User, Trash2, Users, Trophy, Globe, FileBarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language?: 'es' | 'en';
  function_called?: string;
}

interface ChatWidgetProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

interface StatisticsDisplayProps {
  data: any;
  type: 'demographic' | 'performance' | 'geographic' | 'weight' | 'comprehensive';
}

const StatisticsDisplay: React.FC<StatisticsDisplayProps> = ({ data, type }) => {
  if (!data) return null;
  
  return (
    <div className="space-y-3 my-3 p-3 bg-muted/30 rounded-lg border border-border/50">
      {/* Demographic Stats */}
      {type === 'demographic' && data.edades && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 bg-background">
            <div className="text-xs text-muted-foreground mb-1">Más Joven</div>
            <div className="text-xl font-bold text-primary">{data.edades.masJoven} años</div>
          </Card>
          <Card className="p-3 bg-background">
            <div className="text-xs text-muted-foreground mb-1">Más Viejo</div>
            <div className="text-xl font-bold text-primary">{data.edades.masViejo} años</div>
          </Card>
          <Card className="p-3 bg-background">
            <div className="text-xs text-muted-foreground mb-1">Promedio</div>
            <div className="text-xl font-bold text-primary">{data.edades.promedio} años</div>
          </Card>
        </div>
      )}

      {/* Age Distribution Chart */}
      {data.edades?.distribucion && (
        <div className="space-y-2 mt-3">
          <div className="text-xs font-medium mb-2 text-muted-foreground">Distribución por Edad</div>
          {Object.entries(data.edades.distribucion).map(([key, value]: [string, any]) => {
            const maxValue = Math.max(...Object.values(data.edades.distribucion).map(v => Number(v)));
            const percentage = (Number(value) / maxValue) * 100;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className="text-xs w-12 font-medium">{key}</div>
                <div className="flex-1 bg-muted rounded-full h-7 overflow-hidden border border-border/50">
                  <div 
                    className="bg-primary h-full flex items-center justify-end pr-2 text-xs text-primary-foreground font-medium transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  >
                    {value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Performance Stats */}
      {type === 'performance' && data.topGanadores && (
        <div>
          <div className="text-xs font-medium mb-2 text-muted-foreground">Top 5 Ganadores</div>
          <div className="space-y-1">
            {data.topGanadores.slice(0, 5).map((fighter: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-background rounded border border-border/50">
                <span className="text-sm font-medium">
                  {idx + 1}. {fighter.first_name} {fighter.last_name}
                </span>
                <Badge variant="outline" className="font-mono">
                  {fighter.record_wins}-{fighter.record_losses}-{fighter.record_draws}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geographic Stats */}
      {type === 'geographic' && data.top5Paises && (
        <div className="space-y-2">
          <div className="text-xs font-medium mb-2 text-muted-foreground">Top 5 Países</div>
          {data.top5Paises.map(([country, count]: [string, number], idx: number) => {
            const maxValue = Number(data.top5Paises[0][1]);
            const percentage = (Number(count) / maxValue) * 100;
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="text-xs w-20 font-medium truncate">{country}</div>
                <div className="flex-1 bg-muted rounded-full h-7 overflow-hidden border border-border/50">
                  <div 
                    className="bg-primary h-full flex items-center justify-end pr-2 text-xs text-primary-foreground font-medium transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Report Summary */}
      {type === 'comprehensive' && (
        <div className="grid grid-cols-2 gap-2">
          {data.demografico?.edades && (
            <Card className="p-3 bg-background">
              <div className="text-xs text-muted-foreground mb-1">Edad Promedio</div>
              <div className="text-xl font-bold text-primary">{data.demografico.edades.promedio} años</div>
            </Card>
          )}
          {data.rendimiento?.tasaVictoriaPromedio && (
            <Card className="p-3 bg-background">
              <div className="text-xs text-muted-foreground mb-1">Victorias Promedio</div>
              <div className="text-xl font-bold text-primary">{data.rendimiento.tasaVictoriaPromedio}</div>
            </Card>
          )}
          {data.geografico?.totalPaises && (
            <Card className="p-3 bg-background">
              <div className="text-xs text-muted-foreground mb-1">Países</div>
              <div className="text-xl font-bold text-primary">{data.geografico.totalPaises}</div>
            </Card>
          )}
          {data.categoriasPeso?.totalCategorias && (
            <Card className="p-3 bg-background">
              <div className="text-xs text-muted-foreground mb-1">Categorías</div>
              <div className="text-xl font-bold text-primary">{data.categoriasPeso.totalCategorias}</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  isMinimized = false, 
  onToggleMinimize 
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Initialize conversation with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '¡Hola! Soy tu asistente AI administrativo. Puedo ayudarte con:\n\n**Gestión de Torneos** - Crear, programar eventos\n**Fighter IDs** - Buscar, validar peleadores\n**Licencias** - Revisar, aprobar licencias\n**Reportes** - Generar estadísticas\n\n¿En qué puedo ayudarte hoy?',
        timestamp: new Date(),
        language: 'es'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('admin-ai-assistant', {
        body: {
          message: userMessage.content,
          conversation_history: conversationHistory,
          conversation_id: conversationId
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Error connecting to AI assistant');
      }

      if (!data) {
        throw new Error('No response from AI assistant');
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date(),
        language: data.language,
        function_called: data.function_called
      };

      // Add indicator for offline mode
      if (data.isOfflineMode) {
        assistantMessage.content = `🔴 MODO OFFLINE\n\n${assistantMessage.content}`;
      }

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      // Show function called badge if applicable
      if (data.function_called) {
        toast({
          title: "Función Ejecutada",
          description: `Se ejecutó: ${data.function_called}`,
          duration: 2000,
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Conexión fallida'}. Por favor, inténtalo de nuevo.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el asistente AI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Widget toggle button (when closed)
  if (!isOpen) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-xl hover:scale-110 transition-transform"
          size="lg"
        >
          <MessageSquare className="h-7 w-7" />
        </Button>
      </div>
    );
  }

  // Full chat interface - Optimized for Desktop
  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[480px] h-screen p-0 flex flex-col">
          {/* Fixed Header */}
          <SheetHeader className="border-b p-4 bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg">Asistente AI Admin</SheetTitle>
                  {isLoading && (
                    <Badge variant="secondary" className="text-xs animate-pulse mt-1">
                      ✍️ Analizando...
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="h-8 w-8 p-0"
                title="Limpiar conversación"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  // Try to detect if content has structured data
                  let parsedData = null;
                  let dataType = null;
                  
                  try {
                    // Look for JSON-like patterns in content
                    const jsonMatch = message.content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      parsedData = JSON.parse(jsonMatch[0]);
                      
                      // Determine data type
                      if (parsedData.demografico || parsedData.edades) dataType = 'demographic';
                      else if (parsedData.topGanadores || parsedData.rendimiento) dataType = 'performance';
                      else if (parsedData.top5Paises || parsedData.geografico) dataType = 'geographic';
                      else if (parsedData.demografico && parsedData.rendimiento) dataType = 'comprehensive';
                    }
                  } catch (e) {
                    // Not JSON, render normally
                  }

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 items-start ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-primary shadow-sm' 
                          : 'bg-muted border border-border'
                      }`}>
                        {message.role === 'assistant' ? (
                          <Bot className="h-5 w-5 text-primary" />
                        ) : (
                          <User className="h-5 w-5 text-primary-foreground" />
                        )}
                      </div>
                      <div
                        className={`rounded-xl px-4 py-3 text-sm max-w-[85%] ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/70 border border-border/50'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        
                        {/* Render statistics if detected */}
                        {message.role === 'assistant' && parsedData && dataType && (
                          <StatisticsDisplay data={parsedData} type={dataType as any} />
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                          <span className="text-xs opacity-60">
                            {formatTimestamp(message.timestamp)}
                          </span>
                          {message.function_called && (
                            <Badge variant="outline" className="text-xs">
                              🔧 {message.function_called}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted border border-border">
                      <Bot className="h-5 w-5 text-primary animate-pulse" />
                    </div>
                    <div className="rounded-xl px-4 py-3 bg-muted/70 border border-border/50">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Fixed Input Area */}
          <div className="border-t bg-background/95 backdrop-blur p-4 space-y-3">
            {/* Quick Actions - Analysis Focused */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Análisis demográfico completo')}
                className="text-xs h-9 justify-start"
              >
                <Users className="mr-2 h-3.5 w-3.5" />
                Demografía
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Top 10 peleadores con más victorias')}
                className="text-xs h-9 justify-start"
              >
                <Trophy className="mr-2 h-3.5 w-3.5" />
                Top Ganadores
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Distribución por países')}
                className="text-xs h-9 justify-start"
              >
                <Globe className="mr-2 h-3.5 w-3.5" />
                Por País
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Reporte completo del sistema')}
                className="text-xs h-9 justify-start"
              >
                <FileBarChart className="mr-2 h-3.5 w-3.5" />
                Reporte Completo
              </Button>
            </div>

            {/* Input Box */}
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta sobre estadísticas, análisis demográfico..."
                disabled={isLoading}
                className="flex-1 h-11"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="lg"
                className="px-5 h-11"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ChatWidget;
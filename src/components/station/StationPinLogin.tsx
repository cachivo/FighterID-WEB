import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

export function StationPinLogin() {
  const { stationNumber } = useParams<{ stationNumber: string }>();
  const navigate = useNavigate();
  
  const [pin, setPin] = useState(['', '', '', '']);
  const [judgeName, setJudgeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Validar número de estación
  useEffect(() => {
    const stationNum = parseInt(stationNumber || '0');
    if (![1, 2, 3].includes(stationNum)) {
      navigate('/access-denied');
    }
  }, [stationNumber, navigate]);

  // Auto-focus primer input
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handlePinChange = (index: number, value: string) => {
    // Solo números
    if (!/^\d*$/.test(value)) return;

    // Actualizar el dígito
    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Solo último carácter
    setPin(newPin);
    setError('');

    // Auto-avanzar al siguiente input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit cuando se completan los 4 dígitos
    if (index === 3 && value && newPin.every(d => d)) {
      handleSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace: borrar y volver atrás
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setPin(digits);
      inputRefs[3].current?.focus();
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (pinCode?: string) => {
    const finalPin = pinCode || pin.join('');
    
    if (finalPin.length !== 4) {
      setError('Debes ingresar los 4 dígitos del PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Obtener IP del cliente (best effort)
      let clientIp = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        clientIp = ipData.ip;
      } catch {
        console.warn('No se pudo obtener IP del cliente');
      }

      // Validar PIN usando función de DB
      const { data, error: validationError } = await supabase.rpc('validate_station_pin', {
        p_station_number: parseInt(stationNumber!),
        p_pin_code: finalPin,
        p_judge_name: judgeName || null,
        p_ip_address: clientIp,
        p_user_agent: navigator.userAgent,
      });

      if (validationError) {
        console.error('Error validando PIN:', validationError);
        throw new Error('Error de conexión. Intenta nuevamente.');
      }

      const validation = data[0];

      if (!validation.valid) {
        setError(validation.failure_reason || 'PIN inválido');
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
        return;
      }

      // PIN válido - Guardar sesión en localStorage
      const sessionData = {
        session_id: validation.session_id,
        station_number: parseInt(stationNumber!),
        event_id: validation.event_id,
        event_name: validation.event_name,
        current_fight_id: validation.current_fight_id,
        judge_name: judgeName || 'Juez sin nombre',
        logged_in_at: new Date().toISOString(),
      };

      localStorage.setItem('station_session', JSON.stringify(sessionData));

      toast.success('🎯 Acceso concedido', {
        description: `Bienvenido, ${judgeName || 'Juez'}`,
      });

      // Redirigir al panel de scoring
      if (validation.current_fight_id) {
        navigate(`/judge/fight/${validation.current_fight_id}`);
      } else {
        navigate(`/estacion${stationNumber}/waiting`);
      }

    } catch (err) {
      console.error('Error en login de estación:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            🎯 Estación de Juez #{stationNumber}
          </CardTitle>
          <CardDescription>
            Ingresa tu PIN de 4 dígitos para acceder al panel de scoring
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* PIN Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-center block">
              PIN de Acceso
            </label>
            <div className="flex gap-3 justify-center">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-14 h-14 text-center text-2xl font-bold"
                  disabled={isLoading}
                  aria-label={`PIN digit ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Judge Name (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tu Nombre (opcional)
            </label>
            <Input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              disabled={isLoading}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Opcional: Ayuda al administrador a identificar quién está usando la estación
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => handleSubmit()}
            disabled={isLoading || pin.some(d => !d)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-5 w-5" />
                Ingresar a la Estación
              </>
            )}
          </Button>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>¿No tienes un PIN?</p>
            <p>Solicítalo al administrador del evento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
 import React, { Component, ErrorInfo, ReactNode } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
 
 interface Props {
   children: ReactNode;
   fallback?: ReactNode;
 }
 
 interface State {
   hasError: boolean;
   error: Error | null;
   errorInfo: ErrorInfo | null;
 }
 
 export class ErrorBoundary extends Component<Props, State> {
   public state: State = {
     hasError: false,
     error: null,
     errorInfo: null,
   };
 
   public static getDerivedStateFromError(error: Error): Partial<State> {
     return { hasError: true, error };
   }
 
   public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
     console.error('[ErrorBoundary] Error capturado:', error);
     console.error('[ErrorBoundary] Info:', errorInfo);
     this.setState({ errorInfo });
   }
 
   private handleRetry = () => {
     this.setState({ hasError: false, error: null, errorInfo: null });
   };
 
   private handleGoHome = () => {
     window.location.href = '/';
   };
 
   private handleReload = () => {
     window.location.reload();
   };
 
   public render() {
     if (this.state.hasError) {
       if (this.props.fallback) {
         return this.props.fallback;
       }
 
       return (
         <div className="min-h-[400px] flex items-center justify-center p-4">
           <Card className="w-full max-w-md">
             <CardHeader className="text-center">
               <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                 <AlertTriangle className="h-6 w-6 text-destructive" />
               </div>
               <CardTitle className="text-xl">Algo salió mal</CardTitle>
               <CardDescription>
                 Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al inicio.
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-3">
               <div className="flex flex-col sm:flex-row gap-2">
                 <Button 
                   onClick={this.handleRetry} 
                   variant="default"
                   className="flex-1 min-h-[44px] touch-manipulation"
                 >
                   <RefreshCw className="h-4 w-4 mr-2" />
                   Reintentar
                 </Button>
                 <Button 
                   onClick={this.handleReload}
                   variant="outline"
                   className="flex-1 min-h-[44px] touch-manipulation"
                 >
                   Recargar página
                 </Button>
               </div>
               <Button 
                 onClick={this.handleGoHome}
                 variant="ghost"
                 className="w-full min-h-[44px] touch-manipulation"
               >
                 <Home className="h-4 w-4 mr-2" />
                 Ir al inicio
               </Button>
               {process.env.NODE_ENV === 'development' && this.state.error && (
                 <details className="mt-4 text-xs text-muted-foreground">
                   <summary className="cursor-pointer hover:text-foreground">
                     Detalles técnicos
                   </summary>
                   <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-32">
                     {this.state.error.toString()}
                     {this.state.errorInfo?.componentStack}
                   </pre>
                 </details>
               )}
             </CardContent>
           </Card>
         </div>
       );
     }
 
     return this.props.children;
   }
 }
 
 export default ErrorBoundary;
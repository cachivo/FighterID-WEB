import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Award, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

interface FighterProfile {
  id: string;
  full_name?: string;
  nickname?: string;
  country?: string;
  avatar_url?: string;
  weight_class?: string;
  discipline?: string;
  level?: string;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  license_number?: string;
  license_issue_date?: string;
  license_expiry_date?: string;
  license_state?: string;
}

interface DigitalFighterTokenProps {
  profile: FighterProfile;
}

export function DigitalFighterToken({ profile }: DigitalFighterTokenProps) {
  const getStatusColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case 'active': return 'bg-fighter-success';
      case 'pending': return 'bg-fighter-warning';
      case 'expired': return 'bg-fighter-danger';
      default: return 'bg-fighter-accent';
    }
  };

  const getLevelVariant = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'profesional': return 'default';
      case 'semi-profesional': return 'secondary';
      case 'amateur': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: '2-digit',
      month: '2-digit'
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'ID';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Main Token Card */}
      <div className="relative aspect-[1.6/1] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
        
        {/* Holographic overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-60" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Content Container */}
        <div className="relative h-full p-6 flex flex-col">
          
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            {/* Avatar and Basic Info */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-slate-600/50 ring-2 ring-purple-500/20">
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback className="bg-slate-700 text-slate-200 font-semibold">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Status indicator */}
                <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ${getStatusColor(profile.license_state)} border-2 border-slate-900`}>
                  <CheckCircle2 className="h-2.5 w-2.5 text-white absolute top-0.5 left-0.5" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-0.5">
                  <h2 className="text-white font-bold text-lg leading-tight truncate">
                    {profile.full_name || 'Nombre no disponible'}
                  </h2>
                  {profile.country && (
                    <span className="text-lg opacity-60">
                      {profile.country === 'Colombia' && '🇨🇴'}
                      {profile.country === 'Venezuela' && '🇻🇪'}
                      {profile.country === 'Mexico' && '🇲🇽'}
                      {profile.country === 'Argentina' && '🇦🇷'}
                    </span>
                  )}
                </div>
                {profile.nickname && (
                  <p className="text-purple-300 text-sm font-medium">
                    "{profile.nickname}"
                  </p>
                )}
              </div>
            </div>

            {/* Level Badge */}
            <Badge 
              variant={getLevelVariant(profile.level)}
              className="bg-slate-800/80 text-purple-300 border-purple-500/30 px-2 py-1 text-xs font-medium"
            >
              <Award className="h-3 w-3 mr-1" />
              {profile.level || 'Active'}
            </Badge>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between mb-4">
            {/* Fighting Record */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-green-400 text-xl font-bold leading-none">
                  {profile.record_wins}
                </div>
                <div className="text-slate-400 text-xs uppercase tracking-wide">W</div>
              </div>
              <div className="text-slate-600 text-xl font-thin">-</div>
              <div className="text-center">
                <div className="text-red-400 text-xl font-bold leading-none">
                  {profile.record_losses}
                </div>
                <div className="text-slate-400 text-xs uppercase tracking-wide">L</div>
              </div>
              <div className="text-slate-600 text-xl font-thin">-</div>
              <div className="text-center">
                <div className="text-yellow-400 text-xl font-bold leading-none">
                  {profile.record_draws}
                </div>
                <div className="text-slate-400 text-xs uppercase tracking-wide">D</div>
              </div>
            </div>

            {/* Weight & Discipline */}
            <div className="text-right">
              {profile.weight_class && (
                <div className="text-slate-300 text-sm font-medium">
                  {profile.weight_class}
                </div>
              )}
              {profile.discipline && (
                <div className="text-slate-500 text-xs uppercase tracking-wide">
                  {profile.discipline}
                </div>
              )}
            </div>
          </div>

          {/* License Section */}
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-400" />
                <span className="text-slate-400 text-xs uppercase tracking-wider">
                  License
                </span>
              </div>
              
              {profile.license_expiry_date && (
                <div className="flex items-center space-x-1 text-slate-500 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span>Exp: {formatDate(profile.license_expiry_date)}</span>
                </div>
              )}
            </div>
            
            {/* License Number */}
            <div className="mt-2 font-mono text-purple-300 text-lg font-bold tracking-wider">
              {profile.license_number || 'No asignado'}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 opacity-10">
            <div className="w-16 h-16 border border-purple-500 rounded-full" />
            <div className="absolute top-2 left-2 w-12 h-12 border border-blue-400 rounded-full" />
          </div>
          
          {/* Bottom decorative line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20 blur-xl -z-10" />
      
      {/* QR Code indicator */}
      <div className="absolute -bottom-2 -right-2 bg-slate-800 border border-slate-600 rounded-lg p-2">
        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-sm flex items-center justify-center">
          <div className="w-4 h-4 bg-white/20 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
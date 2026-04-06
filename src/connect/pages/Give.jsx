"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@connect/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Heart, 
  CreditCard, 
  Building2, 
  Smartphone,
  History,
  ChevronRight,
  Gift,
  Check,
  Copy
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Label } from '@connect/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@connect/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@connect/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@connect/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@connect/components/ui/dialog';
import { Skeleton } from '@connect/components/ui/skeleton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const donationTypes = [
  { value: 'tithe', label: 'Diezmo', icon: '💰', description: 'Honra a Dios con tus primicias' },
  { value: 'offering', label: 'Ofrenda', icon: '🎁', description: 'Ofrenda voluntaria de amor' },
  { value: 'missions', label: 'Misiones', icon: '🌍', description: 'Apoyo a la obra misionera' },
  { value: 'building_fund', label: 'Fondo de Construcción', icon: '🏗️', description: 'Mejoras del templo' },
];

const quickAmounts = [500, 1000, 2000, 5000, 10000];

export default function Give() {
  const [user, setUser] = useState(null);
  const [selectedType, setSelectedType] = useState('tithe');
  const [amount, setAmount] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await api.auth.me();
      setUser(currentUser);
    } catch (e) {
      setUser(null);
    }
  };

  const { data: myDonations = [], isLoading: loadingDonations } = useQuery({
    queryKey: ['donations', 'my'],
    queryFn: () => api.entities.Donation.filter({ donor_email: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createDonationMutation = useMutation({
    mutationFn: (data) => api.entities.Donation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      toast.success('¡Gracias por tu generosidad!');
      setAmount('');
    },
  });

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const handleSubmitDonation = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }
    
    createDonationMutation.mutate({
      amount: parseFloat(amount),
      type: selectedType,
      donor_name: user?.full_name || 'Anónimo',
      donor_email: user?.email,
      payment_method: 'transfer',
      payment_status: 'pending',
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const bankInfo = {
    bank: 'Banco Nación',
    accountType: 'Cuenta Corriente',
    accountNumber: '1234567890',
    cbu: '0110123456789012345678',
    alias: 'CFC.ISIDRO.CASANOVA',
    holder: 'Asociación Centro Familiar Cristiano',
    cuit: '30-12345678-9',
  };

  const typeLabels = {
    tithe: 'Diezmo',
    offering: 'Ofrenda',
    missions: 'Misiones',
    building_fund: 'Fondo de Construcción',
    other: 'Otro',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-pink-600 px-4 py-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-white/20 rounded-xl">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Dar es Adorar</h1>
            <p className="text-white/80 text-sm">Tu generosidad bendice a muchos</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 -mt-4 space-y-4">
        {/* Main Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            {/* Donation Type */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Tipo de Donación
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {donationTypes.map((type) => (
                  <motion.button
                    key={type.value}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType(type.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedType === type.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{type.icon}</span>
                    <span className="font-medium text-gray-900 block">{type.label}</span>
                    <span className="text-xs text-gray-500">{type.description}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Monto (ARS)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="pl-10 text-2xl h-14 font-semibold"
                />
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {quickAmounts.map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(value)}
                    className={amount === value.toString() ? 'bg-red-50 border-red-300' : ''}
                  >
                    ${value.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <Button
                onClick={() => setShowBankInfo(true)}
                variant="outline"
                className="w-full justify-between h-14 text-left"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="font-medium block">Transferencia Bancaria</span>
                    <span className="text-xs text-gray-500">CBU / Alias</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Button>
              
              <Button
                onClick={handleSubmitDonation}
                disabled={!amount || createDonationMutation.isPending}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-lg font-semibold"
              >
                <Gift className="w-5 h-5 mr-2" />
                {createDonationMutation.isPending ? 'Procesando...' : 'Registrar Donación'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Donation History */}
        {user && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Mi Historial
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
                  Ver todo
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDonations ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : myDonations.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">
                  No tienes donaciones registradas
                </p>
              ) : (
                <div className="space-y-2">
                  {myDonations.slice(0, 3).map((donation) => (
                    <div 
                      key={donation.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{typeLabels[donation.type]}</span>
                        <span className="text-xs text-gray-500 block">
                          {format(new Date(donation.created_date), 'd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                      <span className="font-semibold text-green-600">
                        ${donation.amount?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Scripture */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-gray-700 italic text-sm leading-relaxed">
            "Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, 
            porque Dios ama al dador alegre."
          </p>
          <p className="text-amber-700 font-medium text-sm mt-2">— 2 Corintios 9:7</p>
        </div>
      </div>

      {/* Bank Info Dialog */}
      <Dialog open={showBankInfo} onOpenChange={setShowBankInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Datos Bancarios
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Banco</span>
                <span className="font-medium">{bankInfo.bank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tipo de Cuenta</span>
                <span className="font-medium">{bankInfo.accountType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Titular</span>
                <span className="font-medium text-right text-sm">{bankInfo.holder}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">CUIT</span>
                <span className="font-medium">{bankInfo.cuit}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <span className="text-xs text-gray-500 block">CBU</span>
                  <span className="font-mono font-medium">{bankInfo.cbu}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => copyToClipboard(bankInfo.cbu)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <span className="text-xs text-gray-500 block">Alias</span>
                  <span className="font-mono font-medium">{bankInfo.alias}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => copyToClipboard(bankInfo.alias)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Una vez realizada la transferencia, vuelve a esta pantalla para registrar tu donación
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial de Donaciones
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {myDonations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No tienes donaciones registradas
              </p>
            ) : (
              myDonations.map((donation) => (
                <div 
                  key={donation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{typeLabels[donation.type]}</span>
                    <span className="text-sm text-gray-500 block">
                      {format(new Date(donation.created_date), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-green-600 block">
                      ${donation.amount?.toLocaleString()}
                    </span>
                    <span className={`text-xs ${
                      donation.payment_status === 'completed' ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {donation.payment_status === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { isValidCPF } from '@/shared/utils/validators';
import { useCreatePatient } from '../hooks/useCreatePatient';
import { useDoctors } from '@/features/doctors/hooks/useDoctors';
import { BrazilPhoneInput } from '@/shared/components/BrazilPhoneInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Stethoscope, CheckCircle2, Loader2 } from 'lucide-react';
import type { Patient } from '../types';

const schema = z.object({
  medicoId: z.string().min(1, 'Selecione o médico responsável.'),
  nome_completo: z.string().min(3, 'Mínimo de 3 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  cpf: z.string().min(11, 'Informe o CPF com 11 dígitos.').refine((v) => isValidCPF(v) || v.replace(/\D/g, '').length === 11, 'CPF inválido.'),
  telefone: z.string().min(10, 'Informe o WhatsApp com DDD.'),
  valor_consulta: z.string().refine((v) => {
    const num = parseFloat(v.replace(/[R$\s.]/g, '').replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Valor deve ser maior que zero.'),
  data_consulta: z.string().optional(),
  observacoes: z.string().optional(),
  gerarNotaImediata: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicoId?: string;
  onSuccess: (patient: Patient) => void;
}

export function PatientFormDialog({
  open,
  onOpenChange,
  medicoId: defaultMedicoId,
  onSuccess,
}: PatientFormDialogProps) {
  const { isLoading, error, duplicateId, create, reset } = useCreatePatient();
  const { allDoctors } = useDoctors();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      medicoId: defaultMedicoId || '',
      nome_completo: '',
      email: '',
      cpf: '',
      telefone: '',
      valor_consulta: '250,00',
      data_consulta: new Date().toISOString().split('T')[0],
      observacoes: '',
      gerarNotaImediata: false,
    },
  });

  // Atualiza medicoId quando allDoctors carregar ou mudar
  useEffect(() => {
    if (defaultMedicoId) {
      form.setValue('medicoId', defaultMedicoId);
    } else if (allDoctors.length > 0 && !form.getValues('medicoId')) {
      form.setValue('medicoId', allDoctors[0].id);
    }
  }, [defaultMedicoId, allDoctors, form]);

  const handleSubmit = async (values: FormValues) => {
    const rawValue = parseFloat(
      values.valor_consulta.replace(/[R$\s.]/g, '').replace(',', '.')
    );

    const patient = await create({
      medicoId: values.medicoId,
      nome_completo: values.nome_completo,
      email: values.email,
      cpf: values.cpf,
      telefone: values.telefone,
      valor_consulta: rawValue,
      data_consulta: values.data_consulta,
      observacoes: values.observacoes,
    });

    if (patient) {
      // Se optou por gerar nota imediatamente
      if (values.gerarNotaImediata) {
        setIsGeneratingInvoice(true);
        try {
          const { generatePatientInvoice } = await import('../patients.repository');
          await generatePatientInvoice(patient.id);
          toast.success(`Paciente cadastrado e NFS-e emitida com sucesso para Dr(a).!`);
        } catch (err: any) {
          toast.error(`Paciente cadastrado, mas houve aviso na Focus: ${err.message}`);
        } finally {
          setIsGeneratingInvoice(false);
        }
      } else {
        toast.success(`Paciente ${patient.nome_completo} cadastrado com sucesso.`);
      }

      form.reset();
      onSuccess(patient);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px] rounded-none border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display font-semibold text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-[#B7F20B]" />
            <span>Novo Paciente & Faturamento</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-sans">
            Cadastre os dados do paciente e selecione o médico prestador para emissão da NFS-e.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-3 rounded-none border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>{error}</p>
              {duplicateId && (
                <span className="text-[11px] opacity-80 block mt-0.5">
                  Paciente com este CPF já existe no cadastro.
                </span>
              )}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* 1. SELEÇÃO DO MÉDICO RESPONSÁVEL */}
            <FormField
              control={form.control}
              name="medicoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium flex items-center justify-between">
                    <span>Médico Responsável (Prestador) *</span>
                    <span className="text-[10px] text-muted-foreground">Emissor da NFS-e</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-xs rounded-none bg-background border-border">
                        <SelectValue placeholder="Selecione o médico" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-none">
                      {allDoctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id} className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            {doc.foto_perfil ? (
                              <img
                                src={doc.foto_perfil}
                                alt={doc.nome_completo}
                                className="h-4 w-4 rounded-full object-cover shrink-0"
                                style={{ borderRadius: '100%' }}
                              />
                            ) : (
                              <div
                                className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold shrink-0"
                                style={{ borderRadius: '100%' }}
                              >
                                {doc.nome_completo.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-foreground">
                              Dr(a). {doc.nome_completo}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              (CRM: {doc.crm || 'ISENTO'})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. NOME COMPLETO DO PACIENTE */}
            <FormField
              control={form.control}
              name="nome_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Nome Completo do Paciente *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Carlos Eduardo da Silva"
                      className="h-9 text-xs rounded-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. CPF E E-MAIL (TOMADOR) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">CPF do Paciente *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        className="h-9 text-xs font-mono rounded-none"
                        value={field.value}
                        onChange={(e) => {
                          let raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                          if (raw.length > 9) {
                            raw = raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
                          } else if (raw.length > 6) {
                            raw = raw.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
                          } else if (raw.length > 3) {
                            raw = raw.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
                          }
                          field.onChange(raw);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">E-mail para NFS-e *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="paciente@email.com"
                        className="h-9 text-xs rounded-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 4. WHATSAPP E VALOR DA CONSULTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">WhatsApp do Paciente *</FormLabel>
                    <FormControl>
                      <BrazilPhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="(11) 99999-9999"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_consulta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Valor da Consulta (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="250,00"
                        className="h-9 text-xs font-mono rounded-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 5. OBSERVAÇÕES */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Observações da Consulta (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Retorno de consulta, exames laboratoriais..."
                      className="h-16 text-xs rounded-none resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2 border-t border-border flex items-center justify-between sm:justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="h-8 text-xs rounded-none"
              >
                Cancelar
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={isLoading || isGeneratingInvoice}
                  className="h-8 px-4 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 rounded-none"
                >
                  {isLoading || isGeneratingInvoice ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Salvar Paciente</span>
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

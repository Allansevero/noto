import { IMaskInput } from 'react-imask';
import { forwardRef } from 'react';
import { cn } from '@/shared/utils';

export type MaskType = 'cpf' | 'cnpj' | 'phone' | 'cep' | 'currency';

const MASKS: Record<MaskType, object> = {
  cpf:      { mask: '000.000.000-00' },
  cnpj:     { mask: '00.000.000/0000-00' },
  phone:    { mask: '(00) 00000-0000' },
  cep:      { mask: '00000-000' },
  currency: {
    mask: 'R$ num',
    blocks: {
      num: {
        mask: Number,
        thousandsSeparator: '.',
        radix: ',',
        scale: 2,
        min: 0,
      },
    },
  },
};

interface MaskedInputProps {
  maskType: MaskType;
  value?: string;
  onAccept?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ maskType, value, onAccept, placeholder, className, disabled, id }, ref) => {
    return (
      <IMaskInput
        {...MASKS[maskType]}
        id={id}
        value={value ?? ''}
        onAccept={onAccept}
        placeholder={placeholder}
        disabled={disabled}
        inputRef={ref as React.RefCallback<HTMLInputElement>}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';

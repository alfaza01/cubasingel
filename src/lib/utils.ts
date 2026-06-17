export function cn(...inputs: (string|undefined|null|false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export const formatRupiah = (val: number | string) => {
  const num = Number(val);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const parseNominal = (val: string) => {
  if (!val) return 0;
  const clean = val.replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
};

export const formatInputRupiah = (val: number | string) => {
  const num = typeof val === 'string' ? Number(val) || 0 : val;
  if (!num) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
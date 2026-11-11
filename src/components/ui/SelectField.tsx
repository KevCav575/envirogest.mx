interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: (Option | string)[];
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function SelectField({
  label, value, onChange, options, required = false, className = '', placeholder = 'Seleccionar…',
}: SelectFieldProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-[13px] font-medium text-stone-700">
          {label}{required && <span className="text-red-600 ml-0.5">*</span>}
        </span>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm text-ink focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
      >
        <option value="">{placeholder}</option>
        {options.map(o => {
          const val   = typeof o === 'string' ? o : o.value;
          const lbl   = typeof o === 'string' ? o : o.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </label>
  );
}

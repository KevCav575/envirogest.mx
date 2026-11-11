interface InputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function Input({
  label, value, onChange, type = 'text', placeholder = '', required = false, className = '',
}: InputProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-[13px] font-medium text-stone-700">
          {label}{required && <span className="text-red-600 ml-0.5">*</span>}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
      />
    </label>
  );
}

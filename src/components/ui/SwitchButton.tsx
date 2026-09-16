import { motion } from 'motion/react';

interface SwitchButtonProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}

export default function SwitchButton({ id, checked, onChange, label }: SwitchButtonProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onChange}
      aria-label={label}
      aria-pressed={checked}
      className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer relative ${
        checked ? 'bg-green' : 'bg-zinc-800'
      }`}
    >
      <motion.span
        layout
        aria-hidden="true"
        className={`block w-4 h-4 rounded-full shadow ${checked ? 'bg-black ml-5' : 'bg-zinc-500'}`}
      />
    </button>
  );
}


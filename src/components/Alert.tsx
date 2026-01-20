interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Alert({ message, type }: AlertProps) {
  return (
    <div className={`p-4 rounded-xl mb-5 border ${
      type === 'success' ? 'bg-green-500/20 border-green-500 text-green-400' :
      type === 'error' ? 'bg-red-500/20 border-red-500 text-red-400' :
      'bg-cyan-500/20 border-cyan-500 text-cyan-400'
    }`}>
      {message}
    </div>
  );
}

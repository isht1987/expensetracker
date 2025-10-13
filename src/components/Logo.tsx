export default function Logo({ className }: { className?: string }) {
  return (
    <img 
      src="/src/logo/IMG_7370.jpg" 
      alt="The Billman Logo" 
      className={`${className} rounded-2xl`}
      style={{ objectFit: 'cover' }}
    />
  );
}
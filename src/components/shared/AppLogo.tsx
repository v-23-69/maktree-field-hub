import maktreeLogo from '../../../maktree logo.png'

interface AppLogoProps {
  className?: string
  alt?: string
}

export default function AppLogo({
  className = 'h-16 w-auto',
  alt = 'Maktree Medicines',
}: AppLogoProps) {
  return (
    <img
      src={maktreeLogo}
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
    />
  )
}

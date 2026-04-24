'use client'

import { User } from 'lucide-react'
import { useEffect, useState } from 'react'

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  alt?: string
  className?: string
  fallbackClassName?: string
  imageClassName?: string
  iconClassName?: string
}

function initialFor(name?: string | null) {
  const trimmed = name?.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : ''
}

export function UserAvatar({
  src,
  name,
  alt,
  className = 'h-9 w-9 rounded-full',
  fallbackClassName = 'bg-[var(--surface-hover)] text-[var(--text-secondary)]',
  imageClassName = '',
  iconClassName = 'h-4 w-4',
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false)
  const imageSrc = src?.trim()
  const initial = initialFor(name)

  useEffect(() => {
    setFailed(false)
  }, [imageSrc])

  return (
    <span className={`relative inline-flex flex-shrink-0 overflow-hidden ${className}`}>
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${fallbackClassName}`}
      >
        {initial || <User className={iconClassName} />}
      </span>

      {imageSrc && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt ?? name ?? 'User avatar'}
          className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}

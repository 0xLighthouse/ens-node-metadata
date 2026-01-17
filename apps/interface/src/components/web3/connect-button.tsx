import React from 'react'
import { Auth } from './auth'

interface ConnectButtonProps {
  className?: string
  variant?: 'default' | 'minimal'
  showUserInfo?: boolean
}

// Legacy wrapper component that uses the new Auth component
// Maintains backward compatibility while using the enhanced Auth component
export const ConnectButton: React.FC<ConnectButtonProps> = ({
  className,
  variant = 'minimal',
  showUserInfo = false,
}) => {
  return <Auth className={className} variant={variant} showUserInfo={showUserInfo} />
}

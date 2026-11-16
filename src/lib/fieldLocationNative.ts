import { registerPlugin } from '@capacitor/core'

export type FieldLocationStatus = {
  locationGranted: boolean
  backgroundGranted: boolean
  gpsEnabled: boolean
}

export interface FieldLocationPlugin {
  setSession(options: {
    supabaseUrl: string
    anonKey: string
    accessToken: string
    refreshToken: string
  }): Promise<void>
  allow(): Promise<FieldLocationStatus>
  start(): Promise<FieldLocationStatus>
  stop(): Promise<void>
  status(): Promise<FieldLocationStatus>
  openLocationSettings(): Promise<void>
  alertLocationOff(): Promise<void>
}

export const FieldLocation = registerPlugin<FieldLocationPlugin>('FieldLocation')

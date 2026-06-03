import { useContext } from 'react';
import { OBSContext } from '../context/OBSContext';

/**
 * Custom hook to access the OBS context.
 * Must be used inside an <OBSProvider>.
 */
export function useOBS() {
  const ctx = useContext(OBSContext);
  if (!ctx) throw new Error('useOBS must be used within an OBSProvider');
  return ctx;
}

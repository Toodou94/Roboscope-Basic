export type SlideStatus = 'empty' | 'completed' | 'error' | 'scanning' | 'pending' | 'low-mag-scanned';

export interface SlideLayer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
}

export interface Annotation {
  id: string;
  type: 'rect' | 'circle' | 'arrow' | 'polyline';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  layerId: string;
  userId: string;
  userName: string;
  timestamp: string;
  points?: number[];
  text?: string;
}

export interface Measurement {
  id: string;
  type: 'ruler' | 'area' | 'angle';
  points: number[];
  value: number;
  unit: string;
  color: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface Slide {
  id: string;
  position: number;
  status: SlideStatus;
  progress: number;
  patientId: string;
  patientName: string;
  gender: string;
  testItem: string;
  department: string;
  doctor: string;
  batchId: string;
  timestamp: string;
  thumbnail?: string;
  scanInfo?: string;
  annotations: Annotation[];
  measurements: Measurement[];
  layers: SlideLayer[];
}

export interface Rack {
  id: string;
  name: string;
  capacity: number;
  slides: Slide[];
}

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'paused';

export interface ScanConfig {
  mode: 'auto' | 'semi-auto' | 'custom' | 'z-stack';
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Microscope, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Zap,
  Sun,
  Camera,
  Target,
  Power,
  LogOut,
  Settings,
  Square,
  ShieldCheck,
  X,
  Maximize2,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

// --- Types ---
type Page = 'SELF_CHECK' | 'LOGIN' | 'MAIN';
type Objective = '10X' | '20X' | '40X' | '100X';
type ImagingMode = 'B' | 'FLU';
type FluChannel = 'DAPI' | 'FITC' | 'Cy3' | 'Cy5' | 'CFP';
type FocusMode = 'MANUAL' | 'AFS';
type ScanStatus = 'IDLE' | 'SCANNING' | 'PAUSED';

interface ROI {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

interface SelfCheckItem {
  id: string;
  name: string;
  status: 'pending' | 'checking' | 'success' | 'error';
  elapsed?: number;
}

// --- Components ---

const JoystickBtn = ({ 
  icon: Icon, 
  onStart, 
  onStop,
  className = "", 
  disabled = false 
}: { 
  icon: any, 
  onStart: () => void, 
  onStop: () => void,
  className?: string, 
  disabled?: boolean 
}) => (
  <button
    onMouseDown={onStart}
    onMouseUp={onStop}
    onMouseLeave={onStop}
    onTouchStart={onStart}
    onTouchEnd={onStop}
    disabled={disabled}
    className={`w-10 h-10 flex items-center justify-center bg-white border border-hw-border rounded-lg active:bg-hw-accent active:text-white transition-all disabled:opacity-30 shadow-sm ${className}`}
  >
    <Icon size={20} />
  </button>
);

interface ControlBtnProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  icon?: any;
  className?: string;
}

const ControlBtn: React.FC<ControlBtnProps> = ({ 
  label, 
  active, 
  onClick, 
  icon: Icon,
  className = ""
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all ${
      active 
        ? "bg-hw-accent border-hw-accent text-white active-glow" 
        : "bg-hw-card border-hw-border text-hw-text-dim hover:border-hw-text-main"
    } ${className}`}
  >
    {Icon && <Icon size={16} />}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const FluChannelBtn = ({ 
  channel, 
  active, 
  onClick, 
  color,
  label,
  dye
}: { 
  channel: FluChannel, 
  active: boolean, 
  onClick: () => void,
  color: string,
  label: string,
  dye: string
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    timerRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 500);
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowTooltip(false);
  };

  return (
    <div className="relative">
      <button
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onClick={onClick}
        className={`w-full aspect-square rounded-md border transition-all flex flex-col items-center justify-center gap-0.5 ${
          active ? 'border-hw-accent shadow-sm scale-105 z-10' : 'border-hw-border/20 opacity-70'
        }`}
        style={{ backgroundColor: color }}
      >
        <span className="text-[6px] font-bold text-white drop-shadow-sm">{channel}</span>
      </button>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-hw-card border border-hw-border rounded shadow-xl z-50 whitespace-nowrap pointer-events-none"
          >
            <p className="text-[8px] font-bold text-hw-text-main">{label}</p>
            <p className="text-[7px] text-hw-text-dim">{dye}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RulerSlider = ({ 
  value, 
  onChange, 
  min = 0.1, 
  max = 10 
}: { 
  value: number, 
  onChange: (val: number) => void,
  min?: number,
  max?: number
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const scrollWidth = e.currentTarget.scrollWidth - width;
    const percent = scrollLeft / scrollWidth;
    const newVal = min + (max - min) * percent;
    onChange(Number(newVal.toFixed(1)));
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between px-1">
        <span className="text-[6px] font-mono text-hw-text-dim">{min}μm</span>
        <span className="text-[8px] font-mono font-bold text-hw-accent">{value}μm</span>
        <span className="text-[6px] font-mono text-hw-text-dim">{max}μm</span>
      </div>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-6 bg-hw-bg rounded-lg border border-hw-border overflow-x-auto overflow-y-hidden scrollbar-hide relative flex items-end pb-1"
      >
        <div className="flex items-end gap-[2px] px-[50%] min-w-max">
          {Array.from({ length: (max - min) * 10 + 1 }).map((_, i) => {
            const val = min + i * 0.1;
            const isMajor = Math.abs(val % 1) < 0.01;
            return (
              <div 
                key={i} 
                className={`w-[1px] bg-hw-border transition-all ${isMajor ? 'h-3 bg-hw-text-dim' : 'h-1.5'}`}
              />
            );
          })}
        </div>
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-full bg-hw-accent z-10 shadow-[0_0_4px_rgba(37,99,235,0.5)]" />
      </div>
    </div>
  );
};

const ROIModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialRois 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: (rois: ROI[]) => void, 
  initialRois: ROI[] 
}) => {
  const [tempRois, setTempRois] = useState<ROI[]>(initialRois);
  const [mode, setMode] = useState<'IDLE' | 'ADDING' | 'EDITING' | 'REMOVING'>('IDLE');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ 
    id: string, 
    type: 'move' | 'resize', 
    corner?: string,
    offsetX?: number,
    offsetY?: number
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempRois(initialRois);
      setMode('IDLE');
      setSelectedId(null);
    }
  }, [isOpen, initialRois]);

  const handleAdd = () => {
    const newRoi: ROI = {
      id: Math.random().toString(36).substr(2, 9),
      x: 25,
      y: 10,
      width: 50,
      height: 10
    };
    setTempRois([...tempRois, newRoi]);
    setSelectedId(newRoi.id);
    setMode('EDITING');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setTempRois(prev => prev.map(roi => {
      if (roi.id !== dragging.id) return roi;
      const newRoi = { ...roi };
      
      if (dragging.type === 'resize') {
        if (dragging.corner === 'tl') {
          newRoi.width += newRoi.x - x;
          newRoi.height += newRoi.y - y;
          newRoi.x = x;
          newRoi.y = y;
        } else if (dragging.corner === 'tr') {
          newRoi.width = x - newRoi.x;
          newRoi.height += newRoi.y - y;
          newRoi.y = y;
        } else if (dragging.corner === 'bl') {
          newRoi.width += newRoi.x - x;
          newRoi.x = x;
          newRoi.height = y - newRoi.y;
        } else if (dragging.corner === 'br') {
          newRoi.width = x - newRoi.x;
          newRoi.height = y - newRoi.y;
        }
      } else if (dragging.type === 'move') {
        newRoi.x = x - (dragging.offsetX || 0);
        newRoi.y = y - (dragging.offsetY || 0);
      }

      // Constraints
      newRoi.width = Math.max(2, newRoi.width);
      newRoi.height = Math.max(2, newRoi.height);
      newRoi.x = Math.max(0, Math.min(100 - newRoi.width, newRoi.x));
      newRoi.y = Math.max(0, Math.min(100 - newRoi.height, newRoi.y));
      
      return newRoi;
    }));
  };

  const handleMouseUp = () => setDragging(null);

  const handleRoiClick = (id: string) => {
    if (mode === 'REMOVING') {
      setTempRois(prev => prev.filter(r => r.id !== id));
    } else if (mode === 'EDITING') {
      setSelectedId(id);
    }
  };

  const handleRoiMouseDown = (e: React.MouseEvent, roi: ROI) => {
    if (mode !== 'EDITING') return;
    e.stopPropagation();
    setSelectedId(roi.id);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDragging({
      id: roi.id,
      type: 'move',
      offsetX: x - roi.x,
      offsetY: y - roi.y
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-[24px] w-[480px] h-[320px] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-3 border-b border-hw-border flex justify-between items-center bg-slate-50">
              <h3 className="text-[10px] font-bold text-hw-text-main uppercase tracking-widest">ROI 规划</h3>
              <button onClick={onClose} className="p-1 hover:bg-hw-border rounded-full transition-colors">
                <X size={14} className="text-hw-text-dim" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left: Vertical Slide Preview */}
              <div className="w-[140px] bg-hw-bg relative overflow-hidden border-r border-hw-border flex items-center justify-center p-3" ref={containerRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
                <div className="w-full h-full relative bg-white shadow-md border border-hw-border rounded-sm overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800" 
                    alt="ROI Preview" 
                    className="w-full h-full object-cover opacity-60"
                    referrerPolicy="no-referrer"
                  />
                  {tempRois.map(roi => (
                    <div 
                      key={roi.id}
                      onMouseDown={(e) => handleRoiMouseDown(e, roi)}
                      onClick={(e) => { e.stopPropagation(); handleRoiClick(roi.id); }}
                      className={`absolute border-2 transition-shadow ${
                        selectedId === roi.id ? 'border-hw-accent bg-hw-accent/20 z-20 shadow-lg' : 'border-hw-accent/40 bg-hw-accent/5 z-10'
                      } ${mode === 'REMOVING' ? 'hover:border-hw-error hover:bg-hw-error/20 cursor-pointer' : ''} ${mode === 'EDITING' ? 'cursor-move' : ''}`}
                      style={{ 
                        left: `${roi.x}%`, 
                        top: `${roi.y}%`, 
                        width: `${roi.width}%`, 
                        height: `${roi.height}%` 
                      }}
                    >
                      {selectedId === roi.id && mode === 'EDITING' && (
                        <>
                          <div onMouseDown={(e) => { e.stopPropagation(); setDragging({ id: roi.id, type: 'resize', corner: 'tl' }); }} className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-hw-accent rounded-full cursor-nwse-resize z-30" />
                          <div onMouseDown={(e) => { e.stopPropagation(); setDragging({ id: roi.id, type: 'resize', corner: 'tr' }); }} className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-hw-accent rounded-full cursor-nesw-resize z-30" />
                          <div onMouseDown={(e) => { e.stopPropagation(); setDragging({ id: roi.id, type: 'resize', corner: 'bl' }); }} className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-hw-accent rounded-full cursor-nesw-resize z-30" />
                          <div onMouseDown={(e) => { e.stopPropagation(); setDragging({ id: roi.id, type: 'resize', corner: 'br' }); }} className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-hw-accent rounded-full cursor-nwse-resize z-30" />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex-1 p-4 flex flex-col bg-white">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="mb-1">
                    <p className="text-[7px] text-hw-text-dim leading-tight uppercase font-bold tracking-tighter">
                      操作指南: 在左侧玻片视图中规划扫描区域
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={handleAdd}
                      className={`w-full py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                        mode === 'ADDING' ? 'bg-hw-accent text-white border-hw-accent' : 'bg-white text-hw-text-main border-hw-border hover:border-hw-accent'
                      }`}
                    >
                      <Plus size={12} />
                      新增ROI
                    </button>
                    <button 
                      onClick={() => setMode('EDITING')}
                      className={`w-full py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                        mode === 'EDITING' ? 'bg-hw-accent text-white border-hw-accent' : 'bg-white text-hw-text-main border-hw-border hover:border-hw-accent'
                      }`}
                    >
                      <Edit3 size={12} />
                      编辑ROI
                    </button>
                    <button 
                      onClick={() => setMode('REMOVING')}
                      className={`w-full py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                        mode === 'REMOVING' ? 'bg-hw-error text-white border-hw-error' : 'bg-white text-hw-text-main border-hw-border hover:border-hw-error'
                      }`}
                    >
                      <Trash2 size={12} />
                      移除ROI
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-hw-border flex gap-2">
                  <button 
                    onClick={() => onConfirm(tempRois)}
                    className="flex-1 py-2 bg-hw-accent text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-md shadow-hw-accent/20 active:scale-95 transition-all"
                  >
                    确认应用
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 py-2 bg-slate-100 text-hw-text-dim rounded-lg text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

export default function App() {
  const [page, setPage] = useState<Page>('SELF_CHECK');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Self Check State
  const [checkProgress, setCheckProgress] = useState(0);
  const [checkItems, setCheckItems] = useState<SelfCheckItem[]>([
    { id: 'sys', name: '主控与系统', status: 'pending' },
    { id: 'cam', name: '相机模块', status: 'pending' },
    { id: 'stage', name: '位移台模块', status: 'pending' },
    { id: 'light', name: '光源模块', status: 'pending' },
    { id: 'touch', name: '触摸屏模块', status: 'pending' },
    { id: 'storage', name: '存储与数据', status: 'pending' },
  ]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [itemElapsed, setItemElapsed] = useState(0);

  // Main Control State
  const [objective, setObjective] = useState<Objective>('10X');
  const [mode, setMode] = useState<ImagingMode>('B');
  const [fluChannel, setFluChannel] = useState<FluChannel>('DAPI');
  const [shutter, setShutter] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusMode>('MANUAL');
  const [afs, setAfs] = useState(false);
  const [zStep, setZStep] = useState(10);
  const [posX, setPosX] = useState(12500);
  const [posY, setPosY] = useState(8400);
  const [posZ, setPosZ] = useState(2100);
  const [rois, setRois] = useState<ROI[]>([]);
  const [isRoiModalOpen, setIsRoiModalOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('IDLE');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Slide Management
  const [slideCount, setSlideCount] = useState(1);
  const [currentSlideName, setCurrentSlideName] = useState('');
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedTiles, setScannedTiles] = useState<string[]>([]);

  // Movement Timer
  const moveTimer = useRef<NodeJS.Timeout | null>(null);

  // Z-Step Auto-Adjustment Simulation for AFS
  useEffect(() => {
    let afsTimer: NodeJS.Timeout | null = null;
    if (afs && scanStatus === 'SCANNING') {
      afsTimer = setInterval(() => {
        // AI simulating Z-step adjustments
        const jitter = (Math.random() - 0.5) * 0.2;
        setZStep(prev => {
          const next = Number((prev + jitter).toFixed(1));
          return Math.max(0.1, Math.min(20, next));
        });
      }, 2000);
    }
    return () => {
      if (afsTimer) clearInterval(afsTimer);
    };
  }, [afs, scanStatus]);

  const startMove = (dx: number, dy: number, dz: number = 0) => {
    const move = () => {
      if (dz !== 0) {
        setPosZ(prev => {
          const next = prev + dz;
          if (next > 5000 || next < 0) return prev;
          return next;
        });
      } else {
        setPosX(prev => prev + dx);
        setPosY(prev => prev + dy);
      }
    };
    move();
    moveTimer.current = setInterval(move, 100);
  };

  const stopMove = () => {
    if (moveTimer.current) {
      clearInterval(moveTimer.current);
      moveTimer.current = null;
    }
  };

  const handleObjectiveChange = (obj: Objective) => {
    setObjective(obj);
    toast.info(`物镜切换至 ${obj}`);
    
    // PRD: 切换物镜时自动调整 Z-Step
    // 4X/10X: 10, 20X/40X/60X: 2, 100X: 1
    if (obj === '100X') setZStep(1);
    else if (['20X', '40X', '60X'].includes(obj)) setZStep(2);
    else setZStep(10);
    
    // PRD: 触发 AFS 预对焦
    setAfs(true);
    setTimeout(() => setAfs(false), 1500);
  };

  // Simulate Scanning Progress and Images
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (scanStatus === 'SCANNING') {
      progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            setScanStatus('IDLE');
            setShutter(false);
            toast.success(`扫描任务 ${currentSlideName} 已完成`);
            return 100;
          }
          return prev + 1;
        });
      }, 300);
    }

    return () => {
      clearInterval(progressInterval);
    };
  }, [scanStatus, currentSlideName]);

  // Generate tiles once per scan
  useEffect(() => {
    if (scanStatus === 'SCANNING' && scanProgress === 0) {
      const newTiles = Array.from({ length: 24 }).map((_, i) => 
        `https://picsum.photos/seed/${currentSlideName}-${i}/100/100`
      );
      setScannedTiles(newTiles);
    }
  }, [scanStatus, scanProgress, currentSlideName]);

  const handleReset = () => {
    setPosX(12500);
    setPosY(8400);
    setPosZ(2100);
    setObjective('10X');
    setMode('B');
    setFluChannel('DAPI');
    setZStep(10);
    setShutter(false);
    setFocusMode('MANUAL');
    setAfs(false);
    toast.info('系统已恢复初始设置', { duration: 2000 });
  };

  const handleCapture = () => {
    if (mode === 'FLU') {
      setShutter(true);
      toast.info('正在拍摄...', { duration: 1000 });
      setTimeout(() => {
        setShutter(false);
        toast.success('拍摄完成');
      }, 1000);
    } else {
      toast.info('正在拍摄...', { duration: 1000 });
      setTimeout(() => {
        toast.success('拍摄完成');
      }, 1000);
    }
  };

  const handleStartScan = () => {
    const now = new Date();
    const dateStr = now.getFullYear().toString() + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + 
                    now.getDate().toString().padStart(2, '0');
    const slideName = `${dateStr}${slideCount.toString().padStart(4, '0')}`;
    
    setCurrentSlideName(slideName);
    setSlideCount(prev => prev + 1);
    setScanProgress(0);
    setScannedImage(`https://picsum.photos/seed/${slideName}/400/300`);
    setScanStatus('SCANNING');
    if (mode === 'FLU') {
      setShutter(true);
    }
    toast.success(`开始扫描任务: ${slideName}`);
  };

  const handlePauseScan = () => {
    setScanStatus('PAUSED');
    toast.info('扫描已暂停');
  };

  const handleContinueScan = () => {
    setScanStatus('SCANNING');
    toast.success('继续扫描任务');
  };

  const handleCancelScan = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    setScanStatus('IDLE');
    setShutter(false);
    setShowCancelConfirm(false);
    setPosX(0); setPosY(0); setPosZ(0); // 玻片回位
    toast.info('任务取消', { duration: 3000 });
    console.log('Scan cancelled at:', new Date().toISOString());
  };

  const handleLogout = () => {
    // PRD: 保存所有数据，记录日志
    console.log('User logout, saving data and logs...');
    setPage('LOGIN');
    setShowLogoutConfirm(false);
    toast.success('已安全退出登录');
  };

  // --- Handlers ---

  const handleLogin = () => {
    if (!user || !pass) {
      toast.error('请输入完整的登录信息', { duration: 3000 });
      return;
    }

    if (user === 'admin' && pass === 'admin') {
      setPage('MAIN');
      toast.success('登录成功');
    } else {
      toast.error('用户名/密码错误，请修改后重试', { duration: 3000 });
    }
  };

  const handleForgotPassword = () => {
    toast.info('请联系管理员');
  };

  // Simulate Self Check
  useEffect(() => {
    if (page === 'SELF_CHECK') {
      const timer = setInterval(() => {
        setItemElapsed(prev => prev + 0.1);
      }, 100);

      const checkInterval = setInterval(() => {
        setCheckItems(prev => {
          const next = [...prev];
          if (currentItemIndex < next.length) {
            next[currentItemIndex].status = 'success';
            next[currentItemIndex].elapsed = itemElapsed;
          }
          return next;
        });

        if (currentItemIndex < checkItems.length - 1) {
          setCurrentItemIndex(prev => prev + 1);
          setItemElapsed(0);
          setCheckProgress(Math.round(((currentItemIndex + 1) / checkItems.length) * 100));
        } else {
          setCheckProgress(100);
          clearInterval(checkInterval);
          clearInterval(timer);
          toast.success('自检通过，设备可正常使用', { duration: 3000 });
          setTimeout(() => setPage('LOGIN'), 3000);
        }
      }, 1500);

      return () => {
        clearInterval(checkInterval);
        clearInterval(timer);
      };
    }
  }, [page, currentItemIndex, checkItems.length]);

  useEffect(() => {
    if (page === 'SELF_CHECK' && checkItems[currentItemIndex]) {
      setCheckItems(prev => {
        const next = [...prev];
        next[currentItemIndex].status = 'checking';
        return next;
      });
    }
  }, [page, currentItemIndex]);

  const renderLogin = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col items-center bg-[#F4F7FF] relative overflow-hidden"
    >
      {/* Background subtle glow */}
      <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-hw-accent/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-hw-accent/5 rounded-full blur-[80px]" />

      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 z-10 w-full px-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-0.5 mb-1">
          <div className="w-8 h-8 bg-hw-accent rounded-xl flex items-center justify-center shadow-lg shadow-hw-accent/30 mb-0.5">
            <Microscope size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[#334155] leading-none">RoboScope B</h1>
          <p className="text-[7px] text-[#64748B] font-medium tracking-[0.2em]">智能显微成像系统</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[240px] bg-white rounded-[20px] p-3 shadow-xl shadow-hw-accent/5 flex flex-col gap-2 border border-white">
          {/* User ID Input */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 px-1">
              <User size={9} className="text-hw-accent" />
              <span className="text-[7px] font-bold text-hw-accent uppercase tracking-wider">用户 ID</span>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="请输入 ID" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg py-1 px-3 text-[9px] focus:border-hw-accent focus:ring-2 focus:ring-hw-accent/10 outline-none transition-all font-medium text-[#1E293B] placeholder:text-[#94A3B8]"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <ShieldCheck size={9} className="text-[#64748B]" />
                <span className="text-[7px] font-bold text-[#64748B] uppercase tracking-wider">密码</span>
              </div>
              <button 
                onClick={handleForgotPassword}
                className="text-[7px] text-hw-accent hover:underline font-bold"
              >
                忘记密码?
              </button>
            </div>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"} 
                placeholder="请输入密码" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg py-1 px-3 text-[9px] focus:border-hw-accent focus:ring-2 focus:ring-hw-accent/10 outline-none transition-all font-medium text-[#1E293B] placeholder:text-[#94A3B8]"
              />
              <button 
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-hw-accent transition-colors"
              >
                {showPass ? <EyeOff size={10} /> : <Eye size={10} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button 
            onClick={handleLogin}
            className="w-full bg-hw-accent hover:bg-hw-accent/90 text-white font-bold py-1.5 rounded-xl shadow-lg shadow-hw-accent/20 active:scale-[0.98] transition-all text-[10px] flex items-center justify-center gap-2 mt-0.5"
          >
            <span>登录</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-2 flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-[#10B981]" />
          <span className="text-[8px] font-mono text-[#94A3B8] tracking-widest">V1.0.0.0-STABLE</span>
        </div>
        <p className="text-[7px] text-[#94A3B8] font-medium">Copyright © 2022-2025 科莫生智能科技 版权所有</p>
      </div>
    </motion.div>
  );

  const renderSelfCheck = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] bg-white flex flex-col p-4 gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-widest text-hw-text-main">系统自检</h2>
            <p className="text-[9px] text-hw-accent font-bold">系统锁定 正在进行硬件自检与系统初始化</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-mono font-bold text-hw-accent">{checkProgress}%</span>
          </div>
        </div>

        <div className="w-full h-1.5 bg-hw-border rounded-full overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-hw-accent shadow-[0_0_10px_rgba(37,99,235,0.4)]"
            initial={{ width: 0 }}
            animate={{ width: `${checkProgress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-1.5 overflow-hidden">
        {checkItems.map((item) => (
          <div 
            key={item.id} 
            className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
              item.status === 'checking' ? 'bg-hw-accent/5 border-hw-accent shadow-sm' : 
              item.status === 'success' ? 'bg-white border-hw-border' : 
              'bg-hw-bg/50 border-transparent opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <div className={`p-1 rounded-lg ${
                item.status === 'success' ? 'bg-hw-success/10 text-hw-success' : 
                item.status === 'checking' ? 'bg-hw-accent/10 text-hw-accent' : 
                item.status === 'error' ? 'bg-hw-error/10 text-hw-error' :
                'bg-slate-100 text-hw-text-dim'
              }`}>
                {item.status === 'success' ? <CheckCircle2 size={12} /> : 
                 item.status === 'checking' ? <Loader2 size={12} className="animate-spin" /> : 
                 item.status === 'error' ? <AlertCircle size={12} /> :
                 <div className="w-3 h-3 rounded-full border-2 border-current opacity-20" />}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                item.status === 'checking' ? 'text-hw-accent' : 'text-hw-text-main'
              }`}>
                {item.name}
              </span>
            </div>
            {item.status === 'success' && (
              <span className="text-[7px] font-mono text-hw-success font-bold">{item.elapsed?.toFixed(1)}s</span>
            )}
          </div>
        ))}
      </div>

      {/* Current Node Progress */}
      <div className="bg-slate-50 p-2 rounded-xl border border-hw-border flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-hw-text-dim uppercase tracking-widest">
            {checkItems[currentItemIndex] ? `正在检查: ${checkItems[currentItemIndex].name}...` : '自检完成'}
          </span>
          <span className="text-[8px] font-mono font-bold text-hw-accent">{itemElapsed.toFixed(1)}s</span>
        </div>
        <div className="w-full h-1 bg-hw-border rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-hw-accent"
            animate={{ width: `${(itemElapsed / 1.5) * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </motion.div>
  );

  const renderMain = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="w-full h-full flex flex-col overflow-hidden bg-hw-bg"
    >
      {/* Header */}
      <header className="h-9 border-b border-hw-border flex items-center justify-between px-3 bg-white shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-hw-accent rounded-lg flex items-center justify-center">
            <Microscope size={14} className="text-white" />
          </div>
          <span className="text-[10px] font-bold tracking-tight">RoboScope <span className="text-hw-accent">B</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLogoutConfirm(true)} className="p-1 text-hw-text-dim hover:text-hw-error hover:bg-hw-error/10 rounded-lg transition-all">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Far Left: Loader Slide Tray */}
        <div className="w-[50px] border-r border-hw-border p-1.5 bg-white flex flex-col gap-2 shadow-inner overflow-y-auto">
          <div className="flex items-center justify-center px-1">
            <span className="text-[7px] font-bold text-hw-text-dim uppercase tracking-widest text-center leading-tight">Loader 玻片盘</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 p-1 bg-hw-bg rounded-lg border border-hw-border shadow-inner">
            {[1, 2, 3, 4, 5, 6].map((id) => (
              <div 
                key={id} 
                onClick={id === 1 ? () => setIsRoiModalOpen(true) : undefined}
                className={`relative aspect-[1/2.5] bg-white border rounded-sm flex flex-col items-center justify-between py-1 cursor-pointer transition-all hover:border-hw-accent group ${
                  id === 1 ? 'border-hw-accent shadow-sm ring-1 ring-hw-accent/20' : 'border-hw-border opacity-40'
                }`}
              >
                <span className="text-[6px] font-bold text-hw-text-dim group-hover:text-hw-accent transition-colors">{id}</span>
                <div className="w-[80%] h-[70%] bg-slate-50 border border-hw-border/30 rounded-[1px] relative overflow-hidden">
                  {id === 1 && (
                    <div 
                      className="absolute w-1.5 h-1.5 border border-hw-accent bg-hw-accent/40 shadow-[0_0_2px_rgba(59,130,246,0.5)]"
                      style={{ 
                        left: `${35 + (posX/5000) * 20}%`, 
                        top: `${60 + (posY/5000) * 20}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}
                </div>
                <div className="w-[60%] h-[1px] bg-hw-border/40" />
              </div>
            ))}
          </div>
          <div className="mt-auto p-1 bg-slate-50 rounded-lg border border-hw-border/50">
            <p className="text-[6px] text-hw-text-dim leading-tight">点击玻片 1 进入 ROI 规划</p>
          </div>
        </div>

        {/* Middle: Optical Controls */}
        <div className="w-[130px] border-r border-hw-border p-1.5 flex flex-col gap-2 bg-white/50">
          <section className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[7px] font-bold text-hw-text-dim uppercase tracking-widest">物镜</span>
              <span className="text-[8px] font-mono font-bold text-hw-accent">{objective}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(['10X', '20X', '40X', '100X'] as Objective[]).map(obj => (
                <button 
                  key={obj}
                  onClick={() => handleObjectiveChange(obj)}
                  className={`text-[8px] font-bold py-0.5 rounded-lg border transition-all ${
                    objective === obj 
                      ? "bg-hw-accent border-hw-accent text-white shadow-md shadow-hw-accent/20" 
                      : "bg-white border-hw-border text-hw-text-dim hover:border-hw-text-main"
                  }`}
                >
                  {obj}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-0.5">
            <span className="text-[7px] font-bold text-hw-text-dim uppercase tracking-widest px-1">成像模式</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => setMode('B')}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl border transition-all gap-1 ${
                  mode === 'B' ? "bg-hw-accent border-hw-accent text-white shadow-md shadow-hw-accent/20" : "bg-white border-hw-border text-hw-text-dim"
                }`}
              >
                <Sun size={12} />
                <span className="text-[8px] font-bold">明场</span>
              </button>
              <button 
                onClick={() => setMode('FLU')}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl border transition-all gap-1 ${
                  mode === 'FLU' ? "bg-hw-accent border-hw-accent text-white shadow-md shadow-hw-accent/20" : "bg-white border-hw-border text-hw-text-dim"
                }`}
              >
                <Zap size={12} />
                <span className="text-[8px] font-bold">荧光</span>
              </button>
            </div>
            
            <AnimatePresence>
              {mode === 'FLU' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex flex-col gap-1 mt-0.5"
                >
                  <div className="grid grid-cols-5 gap-1 p-0.5 bg-hw-bg rounded-lg border border-hw-border">
                    <FluChannelBtn channel="DAPI" active={fluChannel === 'DAPI'} onClick={() => setFluChannel('DAPI')} color="#3b82f6" label="蓝色" dye="DAPI/细胞核染色" />
                    <FluChannelBtn channel="FITC" active={fluChannel === 'FITC'} onClick={() => setFluChannel('FITC')} color="#22c55e" label="绿色" dye="FITC/GFP" />
                    <FluChannelBtn channel="Cy3" active={fluChannel === 'Cy3'} onClick={() => setFluChannel('Cy3')} color="#f97316" label="橙色" dye="Cy3/RFP" />
                    <FluChannelBtn channel="Cy5" active={fluChannel === 'Cy5'} onClick={() => setFluChannel('Cy5')} color="#ef4444" label="红色" dye="Cy5" />
                    <FluChannelBtn channel="CFP" active={fluChannel === 'CFP'} onClick={() => setFluChannel('CFP')} color="#06b6d4" label="青色" dye="CFP" />
                  </div>
                  
                  <button 
                    onClick={() => setShutter(!shutter)}
                    className={`flex items-center justify-center gap-1.5 py-1 rounded-lg border transition-all ${
                      shutter ? "bg-hw-warning border-hw-warning text-white shadow-md shadow-hw-warning/20" : "bg-white border-hw-border text-hw-text-dim"
                    }`}
                  >
                    <Power size={10} />
                    <span className="text-[7px] font-bold uppercase">Shutter {shutter ? 'ON' : 'OFF'}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="flex flex-col gap-0.5">
            <span className="text-[7px] font-bold text-hw-text-dim uppercase tracking-widest px-1">对焦方式</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => { setFocusMode('MANUAL'); setAfs(false); }}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl border transition-all gap-1 ${
                  focusMode === 'MANUAL' ? "bg-hw-accent border-hw-accent text-white shadow-md shadow-hw-accent/20" : "bg-white border-hw-border text-hw-text-dim"
                }`}
              >
                <Target size={12} />
                <span className="text-[8px] font-bold">手动对焦</span>
              </button>
              <button 
                onClick={() => { setFocusMode('AFS'); setAfs(true); }}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl border transition-all gap-1 ${
                  focusMode === 'AFS' ? "bg-hw-accent border-hw-accent text-white shadow-md shadow-hw-accent/20" : "bg-white border-hw-border text-hw-text-dim"
                }`}
              >
                <ShieldCheck size={12} />
                <span className="text-[8px] font-bold">AFS</span>
              </button>
            </div>
          </section>
        </div>

        {/* Right: Motion Controls */}
        <div className="flex-1 p-1.5 flex flex-col gap-1.5 bg-slate-50/50">
          <div className="flex-1 flex gap-1.5">
            {/* XY Joystick Area */}
            <div className="flex-1 bg-white rounded-3xl border border-hw-border relative flex items-center justify-center shadow-sm p-2">
              <div className="grid grid-cols-3 gap-2">
                <JoystickBtn icon={ChevronUp} onStart={() => startMove(-100, -100)} onStop={stopMove} className="rotate-[-45deg] rounded-lg" />
                <JoystickBtn icon={ChevronUp} onStart={() => startMove(0, -100)} onStop={stopMove} className="rounded-lg" />
                <JoystickBtn icon={ChevronUp} onStart={() => startMove(100, -100)} onStop={stopMove} className="rotate-[45deg] rounded-lg" />
                
                <JoystickBtn icon={ChevronLeft} onStart={() => startMove(-100, 0)} onStop={stopMove} className="rounded-lg" />
                <div className="flex flex-col items-center justify-center">
                  <div className="text-hw-accent font-bold text-[8px] uppercase tracking-widest">XY</div>
                  <div className="text-[6px] font-mono text-hw-text-dim">100μm</div>
                </div>
                <JoystickBtn icon={ChevronRight} onStart={() => startMove(100, 0)} onStop={stopMove} className="rounded-lg" />
                
                <JoystickBtn icon={ChevronDown} onStart={() => startMove(-100, 100)} onStop={stopMove} className="rotate-[45deg] rounded-lg" />
                <JoystickBtn icon={ChevronDown} onStart={() => startMove(0, 100)} onStop={stopMove} className="rounded-lg" />
                <JoystickBtn icon={ChevronDown} onStart={() => startMove(100, 100)} onStop={stopMove} className="rotate-[-45deg] rounded-lg" />
              </div>
            </div>

            {/* Z Control Area */}
            <div className="w-[72px] flex flex-col gap-1">
              <JoystickBtn icon={ChevronUp} onStart={() => startMove(0, 0, zStep)} onStop={stopMove} className="w-full h-7 rounded-lg" />
              <div className="flex-1 bg-white rounded-xl border border-hw-border flex flex-col items-center justify-center gap-0.5 p-1 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between w-full px-0.5">
                  <span className="text-[5px] font-bold text-hw-text-dim uppercase">Z-Step</span>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => setZStep(prev => Math.min(20, Number((prev + 0.1).toFixed(1))))} className="p-0.5 hover:bg-hw-bg rounded">
                      <ChevronUp size={5} className="text-hw-text-dim" />
                    </button>
                    <button onClick={() => setZStep(prev => Math.max(0.1, Number((prev - 0.1).toFixed(1))))} className="p-0.5 hover:bg-hw-bg rounded">
                      <ChevronDown size={5} className="text-hw-text-dim" />
                    </button>
                  </div>
                </div>
                <RulerSlider value={zStep} onChange={setZStep} max={20} />
                {afs && (
                  <div className="absolute top-0.5 right-0.5">
                    <div className="w-1 h-1 rounded-full bg-hw-accent animate-ping" />
                  </div>
                )}
              </div>
              <JoystickBtn icon={ChevronDown} onStart={() => startMove(0, 0, -zStep)} onStop={stopMove} className="w-full h-7 rounded-lg" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="h-8 flex gap-1.5">
            <button 
              onClick={handleReset}
              className="flex-1 bg-white border border-hw-border rounded-xl flex items-center justify-center gap-1.5 active:bg-hw-bg transition-all shadow-sm hover:border-hw-warning/50"
            >
              <RotateCcw size={14} className="text-hw-warning" />
              <span className="text-[9px] font-bold uppercase tracking-wider">重置</span>
            </button>
            
            {scanStatus === 'IDLE' ? (
              <div className="flex-[2] flex gap-2">
                <button 
                  onClick={handleCapture}
                  className="flex-1 bg-white border border-hw-border rounded-xl flex items-center justify-center gap-2 shadow-sm active:bg-hw-bg transition-all hover:border-hw-accent/50"
                >
                  <Camera size={14} className="text-hw-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-hw-text-main">拍摄</span>
                </button>
                <button 
                  onClick={handleStartScan}
                  className="flex-[1.5] bg-hw-success text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-hw-success/20 active:scale-95 transition-all"
                >
                  <Play size={14} className="fill-white" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">开始扫描</span>
                </button>
              </div>
            ) : (
              <div className="flex-[2] flex gap-2">
                <button 
                  onClick={scanStatus === 'SCANNING' ? handlePauseScan : handleContinueScan}
                  className={`flex-1 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-white ${
                    scanStatus === 'SCANNING' ? 'bg-hw-warning shadow-hw-warning/20' : 'bg-hw-success shadow-hw-success/20'
                  }`}
                >
                  {scanStatus === 'SCANNING' ? (
                    <>
                      <Square size={12} className="fill-white" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">暂停</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} className="fill-white" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">继续</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={handleCancelScan}
                  className="flex-1 bg-hw-error text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-hw-error/20 active:scale-95 transition-all"
                >
                  <LogOut size={12} className="rotate-180" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">取消</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <footer className="h-6 bg-white border-t border-hw-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[7px] text-hw-text-dim uppercase font-bold tracking-wider">坐标</span>
            <span className="text-[8px] font-mono font-bold text-hw-accent bg-hw-accent/5 px-2 py-0.5 rounded">{posX}, {posY}, {posZ.toFixed(1)}</span>
          </div>
        </div>
      </footer>

    </motion.div>
  );

  return (
    <div className="w-full h-full relative overflow-hidden bg-hw-bg">
      <AnimatePresence mode="wait">
        {page === 'LOGIN' && renderLogin()}
        {page === 'SELF_CHECK' && renderSelfCheck()}
        {page === 'MAIN' && renderMain()}
      </AnimatePresence>

      {/* Scanning Overlay */}
      <AnimatePresence>
        {scanStatus !== 'IDLE' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col overflow-hidden"
          >
            {/* Real-time Image Display */}
            <div className="flex-1 relative flex items-center justify-center p-4">
              <div className="w-full h-full max-w-[400px] max-h-[240px] bg-black rounded-xl border border-white/10 overflow-hidden relative shadow-2xl">
                {/* Tiled Grid Display */}
                <div className="grid grid-cols-6 grid-rows-4 w-full h-full">
                  {scannedTiles.map((tile, i) => {
                    const tileProgress = (i / scannedTiles.length) * 100;
                    const isScanned = scanProgress > tileProgress;
                    return (
                      <div key={i} className="relative border-[0.5px] border-white/5 overflow-hidden bg-slate-900/20">
                        <AnimatePresence>
                          {isScanned && (
                            <motion.img
                              initial={{ opacity: 0, scale: 1.1 }}
                              animate={{ opacity: 1, scale: 1 }}
                              src={tile}
                              alt={`Tile ${i}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </AnimatePresence>
                        {!isScanned && scanProgress > tileProgress - 5 && (
                          <div className="absolute inset-0 bg-hw-accent/10 animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Scan Overlay Info */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Scanning Grid Effect */}
                  <div className="absolute inset-0 border border-hw-accent/20">
                    <div className="w-full h-[1px] bg-hw-accent/40 absolute top-1/2 -translate-y-1/2 animate-scan-y" />
                    <div className="h-full w-[1px] bg-hw-accent/40 absolute left-1/2 -translate-x-1/2 animate-scan-x" />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls and Progress */}
            <div className="bg-white/5 border-t border-white/10 p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[10px] font-bold tracking-widest uppercase text-white">
                      {scanStatus === 'SCANNING' ? '正在扫描' : '扫描已暂停'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-white/40">ID: {currentSlideName}</span>
                    </div>
                  </div>
                  <p className="text-[8px] font-mono text-white/40">进度: {scanProgress}%</p>
                </div>
                <div className="flex items-center gap-3">
                  {scanStatus === 'SCANNING' ? (
                    <button 
                      onClick={handlePauseScan}
                      className="px-6 py-1.5 bg-hw-warning text-white rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-hw-warning/20 active:scale-95 transition-all"
                    >
                      暂停
                    </button>
                  ) : (
                    <button 
                      onClick={handleContinueScan}
                      className="px-6 py-1.5 bg-hw-success text-white rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-hw-success/20 active:scale-95 transition-all"
                    >
                      继续
                    </button>
                  )}
                  <button 
                    onClick={handleCancelScan}
                    className="px-6 py-1.5 bg-hw-error text-white rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-hw-error/20 active:scale-95 transition-all"
                  >
                    取消
                  </button>
                </div>
              </div>
              
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-hw-accent shadow-[0_0_10px_rgba(37,99,235,0.8)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-5 w-full max-w-[260px] flex flex-col items-center gap-3 text-center shadow-2xl"
            >
              <div className="w-10 h-10 bg-hw-error/10 rounded-full flex items-center justify-center text-hw-error">
                <AlertCircle size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-hw-text-main">确认取消扫描？</h4>
                <p className="text-[9px] text-hw-text-dim leading-relaxed">确认取消本次扫描任务吗？<br />当前结果不会被保存。</p>
              </div>
              <div className="flex flex-col w-full gap-2">
                <button 
                  onClick={confirmCancel}
                  className="w-full py-2 bg-hw-error text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-hw-error/20 active:scale-95 transition-all"
                >
                  确认取消
                </button>
                <button 
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-2 bg-hw-bg text-hw-text-dim rounded-xl text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all border border-hw-border"
                >
                  返回扫描
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-5 w-full max-w-[260px] flex flex-col items-center gap-3 text-center shadow-2xl"
            >
              <div className="w-10 h-10 bg-hw-warning/10 rounded-full flex items-center justify-center text-hw-warning">
                <LogOut size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-hw-text-main">确认退出登录吗？</h4>
                <p className="text-[9px] text-hw-text-dim leading-relaxed">确认退出登录吗，当前未完成的切片将不会被保存。</p>
              </div>
              <div className="flex flex-col w-full gap-2">
                <button 
                  onClick={handleLogout}
                  className="w-full py-2 bg-hw-error text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-hw-error/20 active:scale-95 transition-all"
                >
                  确认退出
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-2 bg-hw-bg text-hw-text-dim rounded-xl text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all border border-hw-border"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ROIModal 
        isOpen={isRoiModalOpen} 
        onClose={() => setIsRoiModalOpen(false)} 
        initialRois={rois} 
        onConfirm={(newRois) => {
          setRois(newRois);
          setIsRoiModalOpen(false);
          toast.success('ROI 设置已更新');
        }}
      />

      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#1E293B',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }
        }}
      />
    </div>
  );
}

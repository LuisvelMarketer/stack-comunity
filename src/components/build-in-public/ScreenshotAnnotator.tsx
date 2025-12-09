import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, FabricText, FabricImage } from 'fabric';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Pencil,
  Square,
  Circle as CircleIcon,
  Type,
  Eraser,
  Undo,
  Check,
  X,
  MousePointer,
} from 'lucide-react';

interface ScreenshotAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedImageUrl: string) => void;
  onCancel: () => void;
  open: boolean;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000', '#ffffff'];

type Tool = 'select' | 'draw' | 'rectangle' | 'circle' | 'text' | 'eraser';

export function ScreenshotAnnotator({ imageUrl, onSave, onCancel, open }: ScreenshotAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [activeTool, setActiveTool] = useState<Tool>('draw');
  const [history, setHistory] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Initialize canvas with image
  useEffect(() => {
    if (!open || !canvasRef.current || !containerRef.current) return;

    const initCanvas = async () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        const containerWidth = containerRef.current?.clientWidth || 800;
        const maxWidth = Math.min(containerWidth - 40, 900);
        const maxHeight = 600;
        
        let width = img.width;
        let height = img.height;
        
        // Scale down if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        const canvas = new FabricCanvas(canvasRef.current!, {
          width,
          height,
          backgroundColor: '#ffffff',
        });

        // Create fabric image and set as background
        try {
          const fabricImg = await FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });
          fabricImg.scaleToWidth(width);
          fabricImg.scaleToHeight(height);
          canvas.backgroundImage = fabricImg;
          canvas.renderAll();
          setImageLoaded(true);
          setHistory([JSON.stringify(canvas.toJSON())]);
        } catch (e) {
          console.error('Error loading image:', e);
        }

        // Initialize drawing brush
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = activeColor;
        canvas.freeDrawingBrush.width = 3;
        canvas.isDrawingMode = true;

        setFabricCanvas(canvas);
      };
      
      img.src = imageUrl;
    };

    initCanvas();

    return () => {
      fabricCanvas?.dispose();
      setFabricCanvas(null);
      setImageLoaded(false);
      setHistory([]);
    };
  }, [open, imageUrl]);

  // Update tool
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw' || activeTool === 'eraser';
    
    if (fabricCanvas.freeDrawingBrush) {
      if (activeTool === 'eraser') {
        fabricCanvas.freeDrawingBrush.color = '#ffffff';
        fabricCanvas.freeDrawingBrush.width = 20;
      } else {
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = 3;
      }
    }
  }, [activeTool, activeColor, fabricCanvas]);

  const saveState = () => {
    if (!fabricCanvas) return;
    setHistory(prev => [...prev, JSON.stringify(fabricCanvas.toJSON())]);
  };

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === 'rectangle') {
      saveState();
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        width: 100,
        height: 60,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
      setActiveTool('select');
    } else if (tool === 'circle') {
      saveState();
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        radius: 40,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
      setActiveTool('select');
    } else if (tool === 'text') {
      saveState();
      const text = new FabricText('Texto', {
        left: 100,
        top: 100,
        fill: activeColor,
        fontSize: 20,
        fontFamily: 'Arial',
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      setActiveTool('select');
    }
  };

  const handleUndo = async () => {
    if (!fabricCanvas || history.length <= 1) return;
    
    const newHistory = [...history];
    newHistory.pop();
    const previousState = newHistory[newHistory.length - 1];
    
    await fabricCanvas.loadFromJSON(JSON.parse(previousState));
    fabricCanvas.renderAll();
    setHistory(newHistory);
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    onSave(dataUrl);
  };

  const tools: { id: Tool; icon: React.ComponentType<any>; label: string }[] = [
    { id: 'select', icon: MousePointer, label: 'Seleccionar' },
    { id: 'draw', icon: Pencil, label: 'Dibujar' },
    { id: 'rectangle', icon: Square, label: 'Rectángulo' },
    { id: 'circle', icon: CircleIcon, label: 'Círculo' },
    { id: 'text', icon: Type, label: 'Texto' },
    { id: 'eraser', icon: Eraser, label: 'Borrador' },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto">
        <DialogHeader>
          <DialogTitle>Anotar captura de pantalla</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tools */}
            <div className="flex gap-1 border rounded-lg p-1">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToolClick(tool.id)}
                  title={tool.label}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            {/* Colors */}
            <div className="flex gap-1 border rounded-lg p-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${
                    activeColor === color ? 'scale-110 border-primary' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setActiveColor(color)}
                />
              ))}
            </div>

            {/* Undo */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleUndo}
              disabled={history.length <= 1}
              title="Deshacer"
            >
              <Undo className="h-4 w-4" />
            </Button>
          </div>

          {/* Canvas Container */}
          <div 
            ref={containerRef} 
            className="border rounded-lg overflow-auto bg-muted/50 flex items-center justify-center"
            style={{ minHeight: '300px', maxHeight: '60vh' }}
          >
            {!imageLoaded && (
              <div className="text-muted-foreground">Cargando imagen...</div>
            )}
            <canvas 
              ref={canvasRef} 
              className={imageLoaded ? '' : 'hidden'}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Guardar anotaciones
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

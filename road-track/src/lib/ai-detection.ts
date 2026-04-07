import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { DamageType } from '@/types';

export interface AIDetectionResult {
  detected: boolean;
  damageType: DamageType;
  confidence: number;
  suggestedSeverity: number;
  reasons: string[];
}

const DAMAGE_INDICATORS: Record<DamageType, { keywords: string[]; severity: number }> = {
  [DamageType.POTHOLE]: {
    keywords: ['hole', 'pothole', 'cavity', 'depression', 'dark spot'],
    severity: 7
  },
  [DamageType.CRACK]: {
    keywords: ['crack', 'line', 'fracture', 'split', 'gap'],
    severity: 5
  },
  [DamageType.SINKHOLE]: {
    keywords: ['sinkhole', 'collapsed', 'subsidence', 'large hole'],
    severity: 9
  },
  [DamageType.ROAD]: {
    keywords: ['road', 'surface', 'asphalt', 'pavement', 'damage'],
    severity: 6
  },
  [DamageType.LIGHT]: {
    keywords: ['light', 'lamp', 'street light', 'pole', 'fixture'],
    severity: 4
  },
  [DamageType.DRAINAGE]: {
    keywords: ['water', 'drain', 'flood', 'puddle', 'gutter'],
    severity: 5
  },
  [DamageType.OTHER]: {
    keywords: [],
    severity: 5
  }
};

const DAMAGE_COLORS: Record<DamageType, number[][]> = {
  [DamageType.POTHOLE]: [[30, 30, 30], [60, 40, 40], [20, 20, 20]],
  [DamageType.CRACK]: [[80, 80, 80], [100, 100, 100], [120, 120, 120]],
  [DamageType.SINKHOLE]: [[40, 30, 20], [50, 35, 25], [60, 40, 30]],
  [DamageType.ROAD]: [[70, 70, 70], [90, 85, 80], [100, 100, 100]],
  [DamageType.LIGHT]: [[200, 200, 100], [255, 255, 200], [180, 180, 80]],
  [DamageType.DRAINAGE]: [[50, 100, 150], [30, 80, 120], [70, 130, 180]],
  [DamageType.OTHER]: [[100, 100, 100], [120, 120, 120], [80, 80, 80]]
};

class AIDamageDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await tf.ready();
      this.model = await cocoSsd.load();
      this.isInitialized = true;
      console.log('AI Damage Detector initialized');
    } catch (error) {
      console.error('Failed to initialize AI model:', error);
      throw error;
    }
  }

  async analyzeImage(imageData: ImageData | HTMLImageElement | HTMLCanvasElement): Promise<AIDetectionResult> {
    const reasons: string[] = [];
    let detectedType = DamageType.OTHER;
    let maxConfidence = 0;
    let baseSeverity = 5;

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let width: number;
    let height: number;
    
    if (imageData instanceof HTMLCanvasElement) {
      canvas = imageData;
      ctx = canvas.getContext('2d')!;
      width = canvas.width;
      height = canvas.height;
    } else {
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d')!;
      
      if (imageData instanceof HTMLImageElement) {
        width = imageData.naturalWidth;
        height = imageData.naturalHeight;
      } else {
        width = imageData.width;
        height = imageData.height;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (imageData instanceof HTMLImageElement) {
        ctx.drawImage(imageData, 0, 0);
      } else {
        ctx.putImageData(imageData, 0, 0);
      }
    }

    const pixelData = ctx.getImageData(0, 0, width, height).data;
    const colorAnalysis = this.analyzeColors(pixelData, width, height);
    
    if (colorAnalysis.darkRegions > 0.1) {
      reasons.push(`Dark regions detected: ${(colorAnalysis.darkRegions * 100).toFixed(1)}% of image`);
      if (colorAnalysis.darkRegions > 0.25) {
        detectedType = DamageType.POTHOLE;
        reasons.push('High probability of pothole (large dark area)');
      }
    }

    if (colorAnalysis.grayVariance > 30) {
      reasons.push(`High texture variance: ${colorAnalysis.grayVariance.toFixed(1)}`);
      if (colorAnalysis.grayVariance > 50) {
        detectedType = DamageType.CRACK;
        reasons.push('Possible crack pattern detected');
      }
    }

    if (colorAnalysis.waterIndicators > 0.05) {
      reasons.push(`Water/moisture indicators: ${(colorAnalysis.waterIndicators * 100).toFixed(1)}%`);
      detectedType = DamageType.DRAINAGE;
    }

    const edgeScore = this.detectEdges(pixelData, width, height);
    if (edgeScore > 0.15) {
      reasons.push(`Edge density: ${(edgeScore * 100).toFixed(1)}%`);
      if (edgeScore > 0.25 && detectedType === DamageType.OTHER) {
        detectedType = DamageType.CRACK;
        reasons.push('Strong edge patterns suggest cracks');
      }
    }

    if (this.model) {
      try {
        const predictions = await this.model.detect(canvas as HTMLCanvasElement);
        for (const pred of predictions) {
          if (['person', 'car', 'bicycle'].includes(pred.class)) {
            reasons.push(`Reference object: ${pred.class} (for scale)`);
          }
          if (pred.score > 0.3) {
            maxConfidence = Math.max(maxConfidence, pred.score);
          }
        }
      } catch (e) {
        console.log('COCO model inference skipped');
      }
    }

    if (detectedType === DamageType.OTHER && reasons.length === 0) {
      reasons.push('No specific damage patterns detected');
    }

    baseSeverity = DAMAGE_INDICATORS[detectedType].severity;
    
    const severityAdjustments = [
      { condition: colorAnalysis.darkRegions > 0.3, adjustment: 2 },
      { condition: colorAnalysis.darkRegions > 0.2, adjustment: 1 },
      { condition: edgeScore > 0.2, adjustment: 1 },
      { condition: maxConfidence > 0.5, adjustment: 1 },
      { condition: colorAnalysis.waterIndicators > 0.1, adjustment: 1 }
    ];

    let severityAdjustment = 0;
    for (const adj of severityAdjustments) {
      if (adj.condition) severityAdjustment += adj.adjustment;
    }

    const suggestedSeverity = Math.min(10, Math.max(1, baseSeverity + severityAdjustment));

    const confidence = Math.min(0.95, 0.4 + maxConfidence + (reasons.length * 0.1));

    return {
      detected: reasons.length > 0,
      damageType: detectedType,
      confidence,
      suggestedSeverity,
      reasons
    };
  }

  private analyzeColors(pixelData: Uint8ClampedArray, width: number, height: number) {
    let darkPixels = 0;
    let waterPixels = 0;
    let totalGray = 0;
    let graySquaredSum = 0;
    const totalPixels = width * height;

    for (let i = 0; i < pixelData.length; i += 16) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      
      const brightness = (r + g + b) / 3;
      totalGray += brightness;
      graySquaredSum += brightness * brightness;

      if (brightness < 80) darkPixels++;
      
      if (b > r * 1.1 && b > g * 1.1 && brightness < 180) {
        waterPixels++;
      }
    }

    const avgGray = totalGray / (totalPixels * 4);
    const variance = (graySquaredSum / (totalPixels * 4)) - (avgGray * avgGray);

    return {
      darkRegions: darkPixels / totalPixels,
      waterIndicators: waterPixels / totalPixels,
      grayVariance: Math.sqrt(variance)
    };
  }

  private detectEdges(pixelData: Uint8ClampedArray, width: number, height: number): number {
    let edgePixels = 0;
    const threshold = 30;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const idxLeft = (y * width + x - 1) * 4;
        const idxRight = (y * width + x + 1) * 4;
        const idxUp = ((y - 1) * width + x) * 4;
        const idxDown = ((y + 1) * width + x) * 4;

        const gx = Math.abs(pixelData[idxRight] - pixelData[idxLeft]);
        const gy = Math.abs(pixelData[idxDown] - pixelData[idxUp]);
        const gradient = Math.sqrt(gx * gx + gy * gy);

        if (gradient > threshold) edgePixels++;
      }
    }

    return edgePixels / (width * height);
  }
}

let detector: AIDamageDetector | null = null;

export async function initializeAIDetector(): Promise<void> {
  if (!detector) {
    detector = new AIDamageDetector();
  }
  await detector.initialize();
}

export async function detectDamage(imageData: ImageData | HTMLImageElement | HTMLCanvasElement): Promise<AIDetectionResult> {
  if (!detector) {
    await initializeAIDetector();
  }
  return detector!.analyzeImage(imageData);
}

export function useAIDetection() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIDetectionResult | null>(null);

  const analyze = useCallback(async (imageElement: HTMLImageElement | HTMLCanvasElement | ImageData) => {
    setIsAnalyzing(true);
    try {
      const detectionResult = await detectDamage(imageElement);
      setResult(detectionResult);
      return detectionResult;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return { analyze, result, isAnalyzing, reset };
}

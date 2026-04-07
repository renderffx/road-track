declare module '@tensorflow-models/coco-ssd' {
  export interface ObjectDetection {
    detect(img: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageData): Promise<Prediction[]>;
  }

  export interface Prediction {
    bbox: number[];
    class: string;
    score: number;
  }

  export function load(config?: { base?: string }): Promise<ObjectDetection>;
}

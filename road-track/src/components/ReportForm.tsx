'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useStore } from '@/store';
import { DamageType, DAMAGE_TYPE_LABELS } from '@/types';
import { formatCoordinates } from '@/lib/utils';
import { getCurrentPosition } from '@/lib/geolocation';
import CameraCapture from './CameraCapture';
import { detectDamage, initializeAIDetector, AIDetectionResult } from '@/lib/ai-detection';

const damageTypes: DamageType[] = [
  DamageType.POTHOLE,
  DamageType.CRACK,
  DamageType.SINKHOLE,
  DamageType.ROAD,
  DamageType.LIGHT,
  DamageType.DRAINAGE,
  DamageType.OTHER,
];

export default function ReportForm() {
  const { addReport } = useStore();
  
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [damageType, setDamageType] = useState<DamageType>(DamageType.POTHOLE);
  const [severity, setSeverity] = useState(5);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'photo' | 'details' | 'success'>('photo');
  const [aiDetecting, setAIDetecting] = useState(false);
  const [aiResult, setAIResult] = useState<AIDetectionResult | null>(null);
  const [aiInitialized, setAIInitialized] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    initializeAIDetector().then(() => setAIInitialized(true)).catch(() => {});
  }, []);

  const handleCapture = useCallback(async (file: File, preview: string) => {
    setImage(preview);
    setImageFile(file);
    setAIResult(null);
    setStep('details');

    const img = new window.Image();
    img.src = preview;
    img.onload = async () => {
      imageRef.current = img;
      if (aiInitialized) {
        setAIDetecting(true);
        try {
          const result = await detectDamage(img);
          setAIResult(result);
          if (result.detected && result.confidence > 0.5) {
            setDamageType(result.damageType);
            setSeverity(result.suggestedSeverity);
          }
        } catch {
          console.error('AI detection failed');
        } finally {
          setAIDetecting(false);
        }
      }
    };
  }, [aiInitialized]);

  const handleGetLocation = async () => {
    setGettingLocation(true);
    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true });
      setLocation({ lat: pos.lat, lng: pos.lng });
      toast.success('Location captured');
    } catch {
      toast.error('Failed to get location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!image || !location) {
      toast.error('Photo and location required');
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = image;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
      }

      const result = await addReport({ imageUrl, lat: location.lat, lng: location.lng, damageType, severity, description: description.trim() || undefined });
      if (result.success) setStep('success');
      else toast.error('Failed to submit');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setImage(null);
    setImageFile(null);
    setDamageType(DamageType.POTHOLE);
    setSeverity(5);
    setDescription('');
    setLocation(null);
    setStep('photo');
    setAIResult(null);
  };

  if (step === 'success') {
    return (
      <div className="text-center py-16 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
        <p className="text-zinc-500 mb-6">Thank you for helping improve your community</p>
        <button onClick={resetForm} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity">
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {step === 'photo' && (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Document the Issue</h2>
            <p className="text-zinc-500">Take a clear photo of the infrastructure problem</p>
          </div>
          <CameraCapture onCapture={handleCapture} />
        </>
      )}

      {step === 'details' && (
        <>
          <button onClick={() => setStep('photo')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {image && (
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800">
              <Image src={image} alt="Preview" fill className="object-cover" unoptimized />
              {aiDetecting && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">AI analyzing...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {aiResult?.detected && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-900 dark:text-blue-100">AI Detection</span>
                <span className="text-xs text-blue-600 dark:text-blue-400">{Math.round(aiResult.confidence * 100)}% confident</span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">Detected: <span className="font-semibold">{DAMAGE_TYPE_LABELS[aiResult.damageType]}</span></p>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-sm font-semibold">Damage Type</label>
            <div className="grid grid-cols-2 gap-2">
              {damageTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setDamageType(type)}
                  className={`
                    p-4 rounded-xl border-2 text-sm font-medium transition-all
                    ${damageType === type 
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black' 
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'}
                  `}
                >
                  {DAMAGE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Severity</label>
              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${severity >= 8 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : severity >= 5 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                {severity}/10
              </span>
            </div>
            <input type="range" min="1" max="10" value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white" />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Minor</span>
              <span>Moderate</span>
              <span>Critical</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} placeholder="Add details about the issue..." className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-transparent resize-none h-24 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors" />
            <p className="text-xs text-zinc-400 text-right">{description.length}/500</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Location</label>
            {location ? (
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <div>
                  <p className="font-mono text-sm">{formatCoordinates(location.lat, location.lng)}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Location captured</p>
                </div>
                <button onClick={handleGetLocation} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Update</button>
              </div>
            ) : (
              <button onClick={handleGetLocation} disabled={gettingLocation} className="w-full p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl flex flex-col items-center gap-3 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
                {gettingLocation ? (
                  <div className="w-8 h-8 border-3 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                )}
                <span className="text-sm text-zinc-500">Tap to capture GPS location</span>
              </button>
            )}
          </div>

          <button onClick={handleSubmit} disabled={!location || submitting} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Report
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

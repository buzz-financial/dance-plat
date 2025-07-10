import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";

interface ImageCropperProps {
  image: string;
  onCancel: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getCroppedImg(imageSrc: string, crop: CropArea): Promise<Blob> {
  // Always output a 320x320 JPEG, regardless of crop size
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelCrop = {
        x: crop.x * scaleX,
        y: crop.y * scaleY,
        width: crop.width * scaleX,
        height: crop.height * scaleY,
      };
      // Output size
      const outputSize = 320;
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject();
      // Draw cropped area scaled to output size
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
      );
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject();
      }, "image/jpeg", 0.85); // 85% quality
    };
    image.onerror = reject;
  });
}

const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCancel, onCropComplete }) => {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const onCropChange = (c: { x: number; y: number }) => setCrop(c);
  const onZoomChange = (z: number) => setZoom(z);
  const onCropCompleteHandler = useCallback((_: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const [loading, setLoading] = useState(false);
  const handleDone = async () => {
    if (!croppedAreaPixels || loading) return;
    setLoading(true);
    try {
      const blob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(blob);
    } catch {
      alert("Failed to crop image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center">
        <div className="relative w-72 h-72 bg-gray-200">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
              <span className="text-lg font-semibold text-gray-700">Processing...</span>
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-4">
          <button className="px-4 py-2 rounded bg-gray-300" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={handleDone} disabled={loading}>
            {loading ? "Cropping..." : "Crop & Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;

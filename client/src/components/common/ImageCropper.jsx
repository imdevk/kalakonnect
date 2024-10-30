import React, { useState, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const ImageCropper = ({ src, onCropComplete, onCancel, aspect = 1, shape = 'rectangle', maxHeight = 300 }) => {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const onCropChange = (newCrop) => {
        setCrop(newCrop);
    };

    const onImageLoad = useCallback((image) => {
        const { width, height } = image.currentTarget;
        const cropWidth = Math.min(100, width);
        const cropHeight = cropWidth / aspect;
        const x = (width - cropWidth) / 2;
        const y = (height - cropHeight) / 2;
        setCrop({ unit: 'px', width: cropWidth, height: cropHeight, x, y });
    }, [aspect]);

    const getCroppedImg = useCallback((image, crop) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        // if (shape === 'circle') {
        //     ctx.globalCompositeOperation = 'destination-in';
        //     ctx.beginPath();
        //     ctx.arc(crop.width / 2, crop.height / 2, crop.width / 2, 0, Math.PI * 2);
        //     ctx.fill();
        // }

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    return;
                }
                blob.name = 'cropped.jpeg';
                resolve(blob);
            }, 'image/jpeg',
                1 // Use maximum quality (1 = 100%)
            );
        });
    }, [shape]);

    const handleSaveCrop = useCallback(async () => {
        if (completedCrop?.width && completedCrop?.height) {
            try {
                setIsSaving(true); // Add this line
                const image = document.getElementById('cropImage');
                const croppedImageBlob = await getCroppedImg(image, completedCrop);
                const croppedImageFile = new File(
                    [croppedImageBlob],
                    'cropped.jpg',
                    {
                        type: 'image/jpeg',
                        lastModified: new Date().getTime()
                    }
                );
                await onCropComplete(croppedImageFile);
            } catch (error) {
                console.error('Error during crop:', error);
            } finally {
                setIsSaving(false); // Add this line
            }
        }
    }, [completedCrop, getCroppedImg, onCropComplete]);

    return (
        <div className="bg-primary-darker rounded-lg p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-primary-off-white text-center mb-2">
                    Crop Image
                </h3>
                <p className="text-primary-light text-center text-sm">
                    Drag to adjust the crop area
                </p>
            </div>

            <div className="bg-primary-darkest rounded-lg p-4 mb-6 flex items-center justify-center" style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}>
                <ReactCrop
                    crop={crop}
                    onChange={onCropChange}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    circularCrop={shape === 'circle'}
                    className="rounded-lg"
                >
                    <img
                        id="cropImage"
                        src={src}
                        alt="Crop preview"
                        onLoad={onImageLoad}
                        className="max-w-full object-contain rounded-lg"
                        style={{ maxHeight: `${maxHeight - 50}px` }}
                    />
                </ReactCrop>
            </div>

            <div className="flex justify-between gap-4">
                {!isSaving && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-primary-dark text-primary-off-white rounded-lg hover:bg-primary-medium transition-colors duration-200"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleSaveCrop}
                    disabled={!completedCrop?.width || !completedCrop?.height || isSaving}
                    className={`flex-1 px-4 py-2 bg-primary-medium text-primary-off-white rounded-lg hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isSaving ? 'w-full' : ''}`}
                >
                    {isSaving ? (
                        <div className="flex items-center justify-center">
                            <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                            Saving...
                        </div>
                    ) : (
                        'Save'
                    )}
                </button>
            </div>
        </div>
    );
};

export default ImageCropper;
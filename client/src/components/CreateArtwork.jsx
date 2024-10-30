import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Select, { components } from 'react-select';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ImageCropper from './common/ImageCropper';
import { FaImage, FaVideo, FaYoutube, FaTimes, FaPlus } from 'react-icons/fa';
import SliderNavigation from './common/SliderNavigation';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';

const artStyles = [
    'Digital Art', 'Traditional Art', 'Photography', 'Sculpture',
    'Illustration', 'Concept Art', 'Pixel Art', '3D Art'
];

const softwareOptions = [
    'Adobe Photoshop', 'Adobe Illustrator', 'Procreate', 'Clip Studio Paint',
    'Blender', 'Maya', 'ZBrush', 'Krita', 'GIMP', 'Affinity Designer',
    'Corel Painter', 'Autodesk SketchBook', 'Paint Tool SAI', 'Aseprite', 'Cinema 4D'
].map(software => ({ value: software, label: software }));

const CreateArtwork = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [video, setVideo] = useState(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [artStyle, setArtStyle] = useState('');
    const [software, setSoftware] = useState([]);
    const [tags, setTags] = useState([]);
    const [currentTag, setCurrentTag] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCropperOpen, setIsCropperOpen] = useState(false);

    const fileInputRef = useRef(null);

    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [activeTab, setActiveTab] = useState('image');

    const navigate = useNavigate();
    const { logout, user, updateUser } = useAuth();

    const artStyleOptions = useMemo(() => artStyles.map(style => ({ value: style, label: style })), []);

    const mediaTabs = useMemo(() => [
        { id: 'image', icon: FaImage, label: 'Image' },
        { id: 'video', icon: FaVideo, label: 'Video' },
        { id: 'youtube', icon: FaYoutube, label: 'YouTube' }
    ], []);

    const selectStyles = useMemo(() => ({
        control: (base) => ({
            ...base,
            backgroundColor: '#0b2b26',
            borderColor: '#235347',
            minHeight: '38px',
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: '#0b2b26',
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#235347' : state.isFocused ? '#163832' : '#0b2b26',
            color: '#edf5ef',
        }),
        singleValue: (base) => ({
            ...base,
            color: '#edf5ef',
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: '#235347',
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: '#edf5ef',
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: '#edf5ef',
            ':hover': {
                backgroundColor: '#163832',
                color: '#edf5ef',
            },
        }),
        valueContainer: (base) => ({
            ...base,
            whiteSpace: 'nowrap',
            overflow: 'auto',
            flexWrap: 'nowrap',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '::-webkit-scrollbar': {
                display: 'none'
            },
        }),
        input: (base) => ({
            ...base,
            margin: '0px',
            color: '#edf5ef',
        }),
        indicatorSeparator: () => ({
            display: 'none',
        }),
        indicatorsContainer: (base) => ({
            ...base,
            height: '38px',
        }),
    }), []);

    const CustomValueContainer = useCallback(({ children, ...props }) => {
        return (
            <components.ValueContainer {...props}>
                <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto' }}>
                    {children}
                </div>
            </components.ValueContainer>
        );
    }, []);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const response = await api.get('/api/users/me');
                updateUser(response.data);
                setIsLoading(false);
            } catch (error) {
                setError('Failed to load user data. Please try again.');
                setIsLoading(false);
                if (error.response && error.response.status === 401) {
                    logout();
                    navigate('/login');
                }
            }
        };
        loadUserData();
    }, [updateUser, logout, navigate]);

    useEffect(() => {
        return () => {
            images.forEach(image => {
                if (image.preview) {
                    URL.revokeObjectURL(image.preview);
                }
            });
        };
    }, [images]);

    if (isLoading) {
        return (
            <div className="flex justify-center my-8">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user.isVerified) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-primary-darkest">
                <div className="bg-primary-darker px-8 py-6 rounded-lg shadow-xl w-full max-w-md">
                    <h2 className="text-3xl font-bold text-primary-lightest mb-6">Account Not Verified</h2>
                    <p className="text-primary-light mb-8">
                        Your account needs to be verified before you can create artworks. Please verify your email to unlock all features.
                    </p>
                    <div className="flex justify-center">
                        <Link
                            to="/verify-email"
                            className="w-full bg-primary-medium text-primary-off-white px-4 py-3 rounded-lg hover:bg-primary-dark transition duration-300 text-center"
                        >
                            Verify Your Email
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // const handleImageChange = (e) => {
    //     setImages([...images, ...e.target.files]);
    // };

    const createImagePreview = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const scaleFactor = Math.min(1, 300 / Math.max(img.width, img.height));
                    canvas.width = img.width * scaleFactor;
                    canvas.height = img.height * scaleFactor;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        resolve({
                            id: Math.random().toString(36).substr(2, 9),
                            preview: URL.createObjectURL(blob),
                            file: file
                        });
                    }, 'image/jpeg', 0.7);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleThumbnailChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                setThumbnailPreview(e.target.result);
                setIsCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        const newImages = await Promise.all(files.map(createImagePreview));
        setImages(prev => [...prev, ...newImages]);
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideo(file);
        }
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && currentTag.trim()) {
            e.preventDefault();
            setTags([...tags, currentTag.trim()]);
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleCropComplete = (croppedImageData) => {

        if (croppedImageData instanceof Blob || croppedImageData instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setThumbnailPreview(e.target.result);
                // Store the File object directly
                setThumbnail(new File([croppedImageData], 'thumbnail.jpg', { type: 'image/jpeg' }));
            };
            reader.readAsDataURL(croppedImageData);
        } else if (typeof croppedImageData === 'string' && croppedImageData.startsWith('data:')) {

            setThumbnailPreview(croppedImageData);
            // Convert data URL to File object
            fetch(croppedImageData)
                .then(res => res.blob())
                .then(blob => {
                    setThumbnail(new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }));
                });
        } else {
            console.error("Unexpected cropped image data format:", typeof croppedImageData);
        }

        setIsCropperOpen(false);
    };

    const handleCropCancel = () => {
        setThumbnailPreview(null);
        setIsCropperOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (!title.trim()) {
                throw new Error('Title is required');
            }

            if (images.length === 0) {
                throw new Error('At least one image is required');
            }

            if (!artStyle) {
                throw new Error('Art style is required');
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);

            images.forEach((image) => {
                formData.append(`images`, image.file);
            });

            if (video) {
                formData.append('video', video);
            }
            if (thumbnail) {
                formData.append('thumbnail', thumbnail);
            }
            formData.append('artStyle', artStyle);
            formData.append('software', JSON.stringify(software.map(s => s.value)));
            formData.append('tags', JSON.stringify(tags));
            formData.append('youtubeUrl', youtubeUrl);

            const response = await api.post('/api/artworks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                logout();
                navigate('/login');
            } else {
                setError(error.message || error.response?.data?.message || 'An error occurred while creating the artwork');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeMedia = (type, id) => {
        if (type === 'image') {
            setImages(prev => prev.filter(img => img.id !== id));
        } else if (type === 'video') {
            setVideo(null);
        } else if (type === 'youtube') {
            setYoutubeUrl('');
        }
    };

    return (
        <div className="min-h-screen bg-primary-darkest text-primary-off-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full space-y-8">
                <h2 className="text-2xl font-bold text-center mb-6">Create New Artwork</h2>
                {error && <ErrorMessage error={error} />}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title Input */}
                    <div>
                        <label htmlFor="title" className="block font-bold mb-2">
                            Title <span className="text-primary-light">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-primary-darker text-primary-off-white border border-primary-medium rounded-lg focus:outline-none focus:border-primary-light"
                            required
                        />
                    </div>

                    {/* Description Input */}
                    <div>
                        <label htmlFor="description" className="block font-bold mb-2">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-primary-darker text-primary-off-white border border-primary-medium rounded-lg focus:outline-none focus:border-primary-light resize-none"
                            rows="4"
                        ></textarea>
                    </div>

                    {/* Media Upload Section */}
                    <div className="border border-primary-medium rounded-lg p-4">
                        <h3 className="font-bold mb-4 text-center">Upload Media</h3>
                        <div>
                            <div className="flex justify-center mb-4">
                                <SliderNavigation
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    tabs={mediaTabs}
                                />
                            </div>

                            <div className="bg-primary-darker p-4 rounded-lg h-40 flex items-center justify-center">
                                {activeTab === 'image' && (
                                    <div
                                        className={`border-2 border-dashed ${images.length === 0 ? 'border-primary-light' : 'border-primary-medium'
                                            } rounded-lg p-4 text-center cursor-pointer w-full h-full flex flex-col items-center justify-center`}
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <FaPlus className="text-3xl mb-2" />
                                        <p>Click to upload images</p>
                                        <p className="text-sm text-primary-light mt-1">At least one image required</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            multiple
                                            accept="image/*"
                                        />
                                    </div>
                                )}
                                {activeTab === 'video' && (
                                    <div
                                        className="border-2 border-dashed border-primary-medium rounded-lg p-4 text-center cursor-pointer w-full h-full flex flex-col items-center justify-center"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <FaPlus className="text-3xl mb-2" />
                                        <p>Click to upload video</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={handleVideoChange}
                                            className="hidden"
                                            accept="video/*"
                                        />
                                    </div>
                                )}
                                {activeTab === 'youtube' && (
                                    <input
                                        type="text"
                                        value={youtubeUrl}
                                        onChange={(e) => setYoutubeUrl(e.target.value)}
                                        className="w-full px-3 py-2 bg-primary-dark text-primary-off-white border border-primary-medium rounded-lg focus:outline-none focus:border-primary-light"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {images.map((image) => (
                                    <div key={image.id} className="relative">
                                        <img src={image.preview} alt="Upload preview" className="w-20 h-20 sm:h-24 sm:w-24 object-cover rounded-lg" />
                                        <button
                                            type="button"
                                            onClick={() => removeMedia('image', image.id)}
                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ))}
                                {video && (
                                    <div className="relative">
                                        <div className="w-20 h-20 sm:h-24 sm:w-24 bg-primary-dark flex items-center justify-center rounded-lg">
                                            <FaVideo className="text-4xl text-primary-light" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeMedia('video')}
                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                )}
                                {youtubeUrl && (
                                    <div className="relative">
                                        <div className="w-20 h-20 sm:h-24 sm:w-24 bg-primary-dark flex items-center justify-center rounded-lg">
                                            <FaYoutube className="text-4xl text-red-500" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeMedia('youtube')}
                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap -mx-2">
                        <div className="w-full md:w-1/3 px-2 mb-4 md:mb-0">
                            <div className="border border-primary-medium rounded-lg p-3 h-full">
                                <h3 className="font-bold mb-4 text-center">Artwork Thumbnail</h3>
                                <div
                                    className="border-2 border-dashed border-primary-medium rounded-lg p-2 text-center cursor-pointer aspect-square w-40 h-40 flex flex-col items-center justify-center mx-auto"
                                    onClick={() => document.getElementById('thumbnail').click()}
                                >
                                    {thumbnailPreview ? (
                                        <img
                                            src={thumbnailPreview}
                                            alt="Thumbnail preview"
                                            className="w-full h-full object-cover rounded-lg"
                                            onError={(e) => {
                                                console.error("Error loading thumbnail preview:", e);
                                                e.target.onerror = null;
                                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <FaPlus className="text-3xl mb-2" />
                                            <p className="text-sm">Upload thumbnail</p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        id="thumbnail"
                                        onChange={handleThumbnailChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-2/3 px-2">
                            <div className="border border-primary-medium rounded-lg p-4 mb-4">
                                <label htmlFor="artStyle" className="block font-bold mb-2">
                                    Art Style <span className="text-primary-light">*</span>
                                </label>
                                <Select
                                    id="artStyle"
                                    options={artStyleOptions}
                                    value={artStyleOptions.find(option => option.value === artStyle)}
                                    onChange={(selectedOption) => setArtStyle(selectedOption ? selectedOption.value : '')}
                                    styles={selectStyles}
                                    placeholder="Select an art style"
                                    className="basic-single"
                                    classNamePrefix="select"
                                    isSearchable={true}
                                    isClearable={true}
                                />
                            </div>
                            <div className="border border-primary-medium rounded-lg p-4">
                                <label htmlFor="software" className="block font-bold mb-2">Software Used</label>
                                <Select
                                    isMulti
                                    name="software"
                                    options={softwareOptions}
                                    value={software}
                                    onChange={setSoftware}
                                    styles={selectStyles}
                                    components={{ ValueContainer: CustomValueContainer }}
                                    isSearchable={true}
                                    placeholder="Select software..."
                                    noOptionsMessage={() => "No more options"}
                                    closeMenuOnSelect={false}
                                    hideSelectedOptions={false}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Thumbnail Cropper Pop-up */}
                    {isCropperOpen && thumbnailPreview && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="max-w-md w-full">
                                <ImageCropper
                                    src={thumbnailPreview}
                                    onCropComplete={handleCropComplete}
                                    onCancel={handleCropCancel}
                                    aspect={1}
                                    maxHeight={400}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="tags" className="block font-bold mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, index) => (
                                <span key={index} className="inline-block bg-primary-medium text-primary-off-white px-3 py-1 rounded-full text-sm">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-primary-off-white font-bold">
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            id="tags"
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            className="w-full px-3 py-2 bg-primary-darker text-primary-off-white border border-primary-medium rounded-lg focus:outline-none focus:border-primary-light"
                            placeholder="Type a tag and press Enter"
                        />
                    </div>




                    <div className="w-full flex flex-col items-center space-y-4">
                        <button
                            type="submit"
                            className="w-full bg-primary-medium text-primary-off-white px-4 py-3 rounded-lg hover:bg-primary-dark disabled:bg-primary-darker disabled:cursor-not-allowed transition duration-300"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <LoadingSpinner />
                                </div>
                            ) : (
                                'Create Artwork'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateArtwork;
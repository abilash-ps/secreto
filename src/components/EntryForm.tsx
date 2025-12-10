import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface EntryFormProps {
  onClose: () => void;
  onSave: () => void;
}

const moodEmojis = [
  { emoji: "😊", label: "Happy" },
  { emoji: "🥰", label: "In Love" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😌", label: "Peaceful" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "🥺", label: "Emotional" },
  { emoji: "✨", label: "Inspired" },
  { emoji: "💭", label: "Thoughtful" },
  { emoji: "💝", label: "Grateful" },
  { emoji: "🦋", label: "Free" }
];

export default function EntryForm({ onClose, onSave }: EntryFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [selectedMood, setSelectedMood] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadId = Date.now().toString();
      setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[uploadId] || 0;
          if (currentProgress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [uploadId]: currentProgress + 10 };
        });
      }, 100);

      const response = await apiClient.uploadPhoto(file);
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [uploadId]: 100 }));

      setPhotos([...photos, response.url]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[uploadId];
          return newProgress;
        });
      }, 1000);
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiClient.createEntry({
        title,
        content,
        entry_date: new Date(entryDate).toISOString(),
        photos,
        mood_emoji: selectedMood
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-romantic-card rounded-lg w-full max-w-2xl my-4 animate-float">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-romantic-light flex items-center">
              <span className="text-romantic-primary mr-2">✍️</span>
              New Secret
            </h2>
            <button
              onClick={onClose}
              className="icon-button text-romantic-muted hover:text-romantic-light transform hover:rotate-90 transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-romantic-muted mb-2">
                How are you feeling?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {moodEmojis.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedMood(emoji)}
                    className={`p-2 rounded-lg text-xl transition-transform hover:scale-110 ${
                      selectedMood === emoji 
                        ? 'bg-romantic-primary/20 ring-2 ring-romantic-primary scale-110' 
                        : 'hover:bg-romantic-secondary/20'
                    }`}
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-romantic-muted mb-1">
                Title {selectedMood && <span className="ml-2">{selectedMood}</span>}
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-romantic-dark border border-romantic-secondary/30 rounded-lg text-romantic-light placeholder-romantic-muted/70 focus:outline-none focus:ring-2 focus:ring-romantic-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-romantic-muted mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 bg-romantic-dark border border-romantic-secondary/30 rounded-lg text-romantic-light focus:outline-none focus:ring-2 focus:ring-romantic-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-romantic-muted mb-1">
                Content
              </label>
              <textarea
                id="content"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 bg-romantic-dark border border-romantic-secondary/30 rounded-lg text-romantic-light placeholder-romantic-muted/70 focus:outline-none focus:ring-2 focus:ring-romantic-primary focus:border-transparent resize-y"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-romantic-muted mb-2">
                Photos
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group animate-float">
                    <img
                      src={photo}
                      alt=""
                      className="h-20 w-20 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-romantic-primary rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <X className="h-4 w-4 text-romantic-dark" />
                    </button>
                  </div>
                ))}
              </div>
              
              {Object.keys(uploadProgress).length > 0 && (
                <div className="mb-4 space-y-2">
                  {Object.entries(uploadProgress).map(([id, progress]) => (
                    <div key={id} className="space-y-1">
                      <div className="flex justify-between text-xs text-romantic-muted">
                        <span>Uploading image...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1 bg-romantic-dark rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-romantic-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <label className="flex items-center justify-center px-4 py-2 border border-romantic-secondary/30 rounded-lg cursor-pointer hover:bg-romantic-dark/50 transition-colors duration-200 group">
                <Upload className="h-5 w-5 mr-2 text-romantic-muted group-hover:text-romantic-light transition-colors duration-200" />
                <span className="text-sm text-romantic-muted group-hover:text-romantic-light transition-colors duration-200">Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-romantic-secondary/30 rounded-lg text-romantic-muted hover:bg-romantic-dark/50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-romantic-primary rounded-lg text-white hover:bg-romantic-accent disabled:opacity-50 transition-all duration-200 hover:scale-105"
              >
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
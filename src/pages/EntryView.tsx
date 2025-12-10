import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ArrowLeft, Trash2, Languages, Edit2, X, Check } from 'lucide-react';
import { apiClient } from '../lib/api';
import { translateText } from '../lib/translator';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  entry_date: string;
  photos: string[];
  created_at: string;
  user_id: string;
  mood_emoji?: string;
}

interface TranslatedContent {
  title: string;
  content: string;
}

export default function EntryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent | null>(null);
  const [translating, setTranslating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntry();
  }, [id]);

  useEffect(() => {
    if (entry) {
      setEditedTitle(entry.title);
      setEditedContent(entry.content);
    }
  }, [entry]);

  const isEntryEditable = (createdAt: string) => {
    const daysSinceCreation = differenceInDays(new Date(), new Date(createdAt));
    return daysSinceCreation <= 3;
  };

  async function fetchEntry() {
    try {
      if (!id) return;
      const data = await apiClient.getEntry(id);
      setEntry(data);
    } catch (error) {
      console.error('Error fetching entry:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!entry) return;
    
    try {
      setSaving(true);
      await apiClient.updateEntry(entry.id, {
        title: editedTitle,
        content: editedContent
      });
      
      setEntry({
        ...entry,
        title: editedTitle,
        content: editedContent,
        updated_at: new Date().toISOString()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating entry:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      if (!entry) return;
      await apiClient.deleteEntry(entry.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  }

  async function handleTranslate() {
    if (!entry) return;
    
    try {
      setTranslating(true);
      const translatedTitle = await translateText(entry.title);
      const translatedContent = await translateText(entry.content);
      
      setTranslatedContent({
        title: translatedTitle,
        content: translatedContent
      });
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-romantic-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-romantic-primary"></div>
      </div>
    );
  }

  if (!entry) return null;

  const canEdit = isEntryEditable(entry.created_at);

  return (
    <div className="min-h-screen bg-romantic-dark">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-romantic-dark py-2 z-10">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-romantic-muted hover:text-romantic-light transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleTranslate}
                disabled={translating}
                className="flex items-center px-3 py-1.5 text-xs bg-romantic-secondary/80 rounded-md text-romantic-light hover:bg-romantic-accent transition-colors"
              >
                <Languages className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">{translating ? 'Translating...' : 'Translate'}</span>
              </button>
            )}
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-3 py-1.5 text-xs bg-romantic-primary/80 rounded-md text-romantic-light hover:bg-romantic-accent transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            {!isEditing && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-romantic-primary hover:text-romantic-accent p-2"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center px-3 py-1.5 text-xs bg-romantic-secondary/80 rounded-md text-romantic-light hover:bg-romantic-accent transition-colors"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-3 py-1.5 text-xs bg-romantic-primary rounded-md text-romantic-light hover:bg-romantic-accent transition-colors"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <article className="bg-romantic-card rounded-lg overflow-hidden shadow-xl">
          {entry.photos?.[0] && (
            <img
              src={entry.photos[0]}
              alt=""
              className="w-full h-48 sm:h-64 object-cover"
            />
          )}
          <div className="p-4 sm:p-5">
            <div className="flex flex-col mb-4">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-2xl font-bold bg-romantic-dark/50 border border-romantic-secondary/30 rounded-lg px-3 py-2 text-romantic-light mb-1 focus:outline-none focus:ring-2 focus:ring-romantic-primary focus:border-transparent"
                />
              ) : (
                <h1 className="text-xl sm:text-2xl font-bold text-romantic-light mb-1 break-words">
                  {entry.title}
                  {entry.mood_emoji && (
                    <span className="ml-2 text-xl">{entry.mood_emoji}</span>
                  )}
                </h1>
              )}
              <time className="text-sm text-romantic-muted">
                {format(new Date(entry.entry_date), 'MMMM d, yyyy')}
                {!canEdit && (
                  <span className="ml-2 text-xs text-romantic-primary">(No longer editable)</span>
                )}
              </time>
            </div>

            <div className="prose prose-invert max-w-none">
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={8}
                  className="w-full bg-romantic-dark/50 border border-romantic-secondary/30 rounded-lg px-3 py-2 text-romantic-light focus:outline-none focus:ring-2 focus:ring-romantic-primary focus:border-transparent"
                />
              ) : (
                <p className="text-romantic-muted whitespace-pre-wrap text-base break-words">
                  {entry.content}
                </p>
              )}
            </div>

            {translatedContent && !isEditing && (
              <div className="translation-container mt-6">
                <h2 className="text-lg font-semibold text-romantic-light mb-2">
                  <span className="text-romantic-primary">♥</span> Malayalam Translation <span className="text-romantic-primary">♥</span>
                </h2>
                <h3 className="text-lg sm:text-xl font-bold text-romantic-light mb-1 break-words">
                  {translatedContent.title}
                </h3>
                <p className="text-romantic-muted whitespace-pre-wrap text-base italic break-words">
                  {translatedContent.content}
                </p>
                <div className="text-xs text-romantic-primary mt-2 text-right">
                  ~ Your feelings in another language ~
                </div>
              </div>
            )}

            {entry.photos && entry.photos.length > 1 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-romantic-light mb-3">Photos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {entry.photos.slice(1).map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt=""
                      className="rounded-lg w-full h-24 sm:h-36 object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-romantic-card rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-romantic-light mb-4">Delete Entry</h3>
            <p className="text-romantic-muted mb-6">
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-romantic-muted hover:bg-romantic-dark/50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
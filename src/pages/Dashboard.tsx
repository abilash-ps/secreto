import React, { useState, useEffect } from 'react';
import { format, parse, isWithinInterval } from 'date-fns';
import { PlusCircle, Trash2, Search, Calendar, X, Filter, Smile } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import EntryForm from '../components/EntryForm';
import ProfileButton from '../components/ProfileButton';
import { Link } from 'react-router-dom';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  entry_date: string;
  photos: string[];
  created_at: string;
  mood_emoji: string;
}

type DateFilterType = 'none' | 'day' | 'month' | 'range';

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

export default function Dashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('none');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [searchTerm, dateFilterType, selectedDate, selectedMonth, dateRange, entries, selectedMoodFilter]);

  const filterEntries = () => {
    let filtered = [...entries];

    // Text search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(searchLower) ||
        entry.content.toLowerCase().includes(searchLower)
      );
    }

    // Mood filter
    if (selectedMoodFilter) {
      filtered = filtered.filter(entry => entry.mood_emoji === selectedMoodFilter);
    }

    // Date filtering
    if (dateFilterType !== 'none') {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        
        if (dateFilterType === 'day' && selectedDate) {
          return entry.entry_date.startsWith(selectedDate);
        }
        
        if (dateFilterType === 'month' && selectedMonth) {
          const [year, month] = selectedMonth.split('-');
          return (
            entryDate.getFullYear() === parseInt(year) && 
            entryDate.getMonth() === parseInt(month) - 1
          );
        }
        
        if (dateFilterType === 'range' && dateRange.start && dateRange.end) {
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          
          return isWithinInterval(entryDate, { start: startDate, end: endDate });
        }
        
        return true;
      });
    }

    setFilteredEntries(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilterType('none');
    setSelectedDate('');
    setSelectedMonth('');
    setDateRange({ start: '', end: '' });
    setSelectedMoodFilter(null);
    setShowSearchPanel(false);
  };

  async function fetchEntries() {
    try {
      const data = await apiClient.getEntries();
      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(entryId: string) {
    try {
      await apiClient.deleteEntry(entryId);
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    } finally {
      setDeleteEntryId(null);
    }
  }

  const formatDateFilter = () => {
    if (dateFilterType === 'day' && selectedDate) {
      return format(new Date(selectedDate), 'MMM d, yyyy');
    }
    if (dateFilterType === 'month' && selectedMonth) {
      return format(parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date()), 'MMMM yyyy');
    }
    if (dateFilterType === 'range' && dateRange.start && dateRange.end) {
      return `${format(new Date(dateRange.start), 'MMM d, yyyy')} - ${format(new Date(dateRange.end), 'MMM d, yyyy')}`;
    }
    return null;
  };

  const hasActiveFilters = searchTerm || dateFilterType !== 'none' || selectedMoodFilter;

  return (
    <div className="min-h-screen bg-romantic-dark">
      <nav className="bg-romantic-card border-b border-romantic-secondary/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-romantic-light">Secreto</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearchPanel(!showSearchPanel)}
                className="flex justify-center items-center p-2 rounded-full bg-romantic-dark text-romantic-muted hover:bg-romantic-secondary/30 transition-colors duration-200"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowEntryForm(true)}
                className="flex justify-center items-center p-2 rounded-full bg-romantic-primary text-white hover:bg-romantic-accent transition-all duration-200 hover:scale-105"
                aria-label="New Entry"
              >
                <PlusCircle className="h-5 w-5" />
              </button>
              <ProfileButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-4 px-4">
        {showSearchPanel && (
          <div className="mb-4 bg-romantic-card rounded-lg shadow-lg p-4 animate-slideDown">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-romantic-light">Search & Filter</h2>
              <button 
                onClick={() => setShowSearchPanel(false)}
                className="text-romantic-muted hover:text-romantic-light transition-transform duration-200 hover:rotate-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Text Search */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-romantic-muted" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by title or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-romantic-secondary/30 rounded-lg bg-romantic-dark text-romantic-light placeholder-romantic-muted/70 focus:outline-none focus:ring-2 focus:ring-romantic-primary focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Mood Filter */}
              <div>
                <label className="block text-sm font-medium text-romantic-muted mb-2">
                  Filter by Mood
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {moodEmojis.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedMoodFilter(selectedMoodFilter === emoji ? null : emoji)}
                      className={`p-2 rounded-lg text-2xl transition-all duration-200 hover:scale-110 ${
                        selectedMoodFilter === emoji 
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
              
              {/* Date Filter Type */}
              <div>
                <label className="block text-sm font-medium text-romantic-muted mb-2">
                  Date Filter
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setDateFilterType(dateFilterType === 'day' ? 'none' : 'day');
                      setSelectedMonth('');
                      setDateRange({ start: '', end: '' });
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      dateFilterType === 'day'
                        ? 'bg-romantic-primary text-white'
                        : 'bg-romantic-dark text-romantic-muted hover:bg-romantic-secondary/20'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => {
                      setDateFilterType(dateFilterType === 'month' ? 'none' : 'month');
                      setSelectedDate('');
                      setDateRange({ start: '', end: '' });
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      dateFilterType === 'month'
                        ? 'bg-romantic-primary text-white'
                        : 'bg-romantic-dark text-romantic-muted hover:bg-romantic-secondary/20'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => {
                      setDateFilterType(dateFilterType === 'range' ? 'none' : 'range');
                      setSelectedDate('');
                      setSelectedMonth('');
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      dateFilterType === 'range'
                        ? 'bg-romantic-primary text-white'
                        : 'bg-romantic-dark text-romantic-muted hover:bg-romantic-secondary/20'
                    }`}
                  >
                    Range
                  </button>
                </div>
              </div>

              {dateFilterType === 'day' && (
                <div>
                  <label htmlFor="day-filter" className="block text-sm font-medium text-romantic-muted mb-2">
                    Select Day
                  </label>
                  <input
                    id="day-filter"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-romantic-secondary/30 rounded-lg bg-romantic-dark text-romantic-light focus:outline-none focus:ring-2 focus:ring-romantic-primary focus:border-transparent transition-colors duration-200"
                  />
                </div>
              )}

              {dateFilterType === 'month' && (
                <div>
                  <label htmlFor="month-filter" className="block text-sm font-medium text-romantic-muted mb-2">
                    Select Month
                  </label>
                  <input
                    id="month-filter"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="block w-full px-3 py-2 border border-romantic-secondary/30 rounded-lg bg-romantic-dark text-romantic-light focus:outline-none focus:ring-2 focus:ring-romantic-primary focus:border-transparent transition-colors duration-200"
                  />
                </div>
              )}

              {dateFilterType === 'range' && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-romantic-muted mb-2">
                      Start Date
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="block w-full px-3 py-2 border border-romantic-secondary/30 rounded-lg bg-romantic-dark text-romantic-light focus:outline-none focus:ring-2 focus:ring-romantic-primary focus:border-transparent transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-romantic-muted mb-2">
                      End Date
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="block w-full px-3 py-2 border border-romantic-secondary/30 rounded-lg bg-romantic-dark text-romantic-light focus:outline-none focus:ring-2 focus:ring-romantic-primary focus:border-transparent transition-colors duration-200"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-romantic-secondary/30 rounded-lg text-romantic-muted hover:bg-romantic-dark/50 transition-colors duration-200"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowSearchPanel(false)}
                  className="px-4 py-2 bg-romantic-primary rounded-lg text-white hover:bg-romantic-accent transition-all duration-200 hover:scale-105"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
        
        {hasActiveFilters && (
          <div className="mb-4 px-3 py-2 bg-romantic-card rounded-lg shadow-md animate-float">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-romantic-muted mr-1">Filters:</span>
              
              {searchTerm && (
                <div className="flex items-center bg-romantic-dark text-romantic-light text-sm rounded-full px-3 py-1">
                  <span className="mr-1 text-xs">"{searchTerm}"</span>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-romantic-muted hover:text-romantic-light transition-colors duration-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {selectedMoodFilter && (
                <div className="flex items-center bg-romantic-dark text-romantic-light text-sm rounded-full px-3 py-1">
                  <span className="mr-1">{selectedMoodFilter}</span>
                  <button 
                    onClick={() => setSelectedMoodFilter(null)}
                    className="text-romantic-muted hover:text-romantic-light transition-colors duration-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {dateFilterType !== 'none' && formatDateFilter() && (
                <div className="flex items-center bg-romantic-dark text-romantic-light text-sm rounded-full px-3 py-1">
                  <span className="mr-1 text-xs">{formatDateFilter()}</span>
                  <button 
                    onClick={() => setDateFilterType('none')}
                    className="text-romantic-muted hover:text-romantic-light transition-colors duration-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <button
                onClick={clearFilters}
                className="text-xs text-romantic-primary hover:text-romantic-accent transition-colors duration-200 ml-auto"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-romantic-primary"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8 bg-romantic-card rounded-lg shadow-md animate-float">
            <h3 className="text-lg font-medium text-romantic-light">
              {entries.length === 0 ? "No secrets yet" : "No entries match your search"}
            </h3>
            <p className="mt-2 text-sm text-romantic-muted">
              {entries.length === 0 ? "Start writing your first secret!" : "Try adjusting your search criteria"}
            </p>
            {entries.length > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-romantic-primary rounded-lg text-white hover:bg-romantic-accent text-sm transition-all duration-200 hover:scale-105"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEntries.map((entry) => (
              <Link
                key={entry.id}
                to={`/entry/${entry.id}`}
                className="block bg-romantic-card border border-romantic-secondary/20 rounded-lg overflow-hidden hover:border-romantic-primary transition-all duration-200 shadow-md diary-card"
              >
                <div className="flex">
                  {entry.photos?.[0] && (
                    <div className="w-24 h-24 flex-shrink-0">
                      <img
                        src={entry.photos[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3 flex-grow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-medium text-romantic-light line-clamp-1">
                          {entry.title}
                        </h3>
                        {entry.mood_emoji && (
                          <span className="text-xl animate-float">{entry.mood_emoji}</span>
                        )}
                      </div>
                      <span className="text-xs text-romantic-muted ml-2 flex-shrink-0">
                        {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-romantic-muted line-clamp-2">{entry.content}</p>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteEntryId(entry.id);
                        }}
                        className="text-romantic-primary hover:text-romantic-accent p-1 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showEntryForm && (
        <EntryForm
          onClose={() => setShowEntryForm(false)}
          onSave={fetchEntries}
        />
      )}

      {deleteEntryId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-romantic-card rounded-lg p-6 max-w-sm w-full animate-float">
            <h3 className="text-lg font-medium text-romantic-light mb-4">Delete Secret</h3>
            <p className="text-romantic-muted mb-6">
              Are you sure you want to delete this secret? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteEntryId(null)}
                className="px-4 py-2 text-sm font-medium text-romantic-muted hover:bg-romantic-dark/50 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteEntryId && handleDelete(deleteEntryId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 hover:scale-105"
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
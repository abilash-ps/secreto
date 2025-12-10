import { apiClient } from './api';

class KeepAliveService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 6 * 24 * 60 * 60 * 1000; // 6 days in milliseconds

  async start() {
    try {
      // Initial ping
      await this.pingDatabase();
      
      // Set up periodic pings
      this.intervalId = setInterval(() => {
        this.pingDatabase();
      }, this.PING_INTERVAL);
      
      console.log('Keep-alive service started');
    } catch (error) {
      console.error('Failed to start keep-alive service:', error);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Keep-alive service stopped');
    }
  }

  private async pingDatabase() {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('No auth token available for keep-alive ping');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/keep-alive`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Database keep-alive ping successful:', data);
      } else {
        console.warn('Keep-alive ping failed:', response.status);
      }
    } catch (error) {
      console.error('Keep-alive ping error:', error);
    }
  }
}

export const keepAliveService = new KeepAliveService();
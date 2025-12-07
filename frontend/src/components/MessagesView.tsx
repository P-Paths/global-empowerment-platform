'use client';

import React, { useState } from 'react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  listing: string;
  isRead: boolean;
}

interface MessagesViewProps {}

export default function MessagesView({}: MessagesViewProps) {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  // Mock data - replace with real API calls
  const messages: Message[] = [
    {
      id: '1',
      sender: 'John D.',
      content: 'Is the car still available? I can come see it today.',
      timestamp: '2m ago',
      listing: '2017 Nissan Altima',
      isRead: false
    },
    {
      id: '2',
      sender: 'Sarah M.',
      content: 'What\'s the lowest you\'ll take for the Honda?',
      timestamp: '15m ago',
      listing: '2019 Honda Civic',
      isRead: true
    },
    {
      id: '3',
      sender: 'Mike R.',
      content: 'Can I schedule a test drive for tomorrow?',
      timestamp: '1h ago',
      listing: '2017 Nissan Altima',
      isRead: true
    }
  ];

  const handleMessageClick = (messageId: string) => {
    setSelectedMessage(selectedMessage === messageId ? null : messageId);
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h1>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {messages.filter(m => !m.isRead).length} unread
        </div>
      </div>

      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 ${
              !message.isRead ? 'border-l-4 border-l-blue-500' : ''
            } ${selectedMessage === message.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleMessageClick(message.id)}
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {message.sender.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {message.sender}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-300">
                    {message.timestamp}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {message.listing}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200 mt-2 line-clamp-2">
                  {message.content}
                </p>
                
                {selectedMessage === message.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium">
                        Reply
                      </button>
                      <button className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-3 rounded-lg text-sm font-medium">
                        Mark Read
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No messages yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            When buyers contact you about your listings, their messages will appear here.
          </p>
        </div>
      )}
    </div>
  );
} 
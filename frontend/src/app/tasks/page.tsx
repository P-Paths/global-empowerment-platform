'use client';

import { useState } from 'react';
import { useTasks, useCreateTask, useCompleteTask, Task } from '@/hooks/useGEMPlatform';
import { CheckCircle2, Circle, Plus, X } from 'lucide-react';
import Header from '@/components/Header';

// Mock tasks for demo
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Post a business update on Instagram',
    description: 'Share your progress and engage with your audience. Post should include a clear call-to-action.',
    completed: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
  },
  {
    id: '2',
    title: 'Create a LinkedIn article about your industry insights',
    description: 'Write a 500-word article sharing your expertise. This will boost your brand clarity score.',
    completed: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
  },
  {
    id: '3',
    title: 'Respond to 5 comments on your recent posts',
    description: 'Engagement is key to building community. Take time to respond thoughtfully.',
    completed: true,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Add pricing information to your product catalog',
    description: 'Complete your product listings with pricing to improve revenue signals.',
    completed: false,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
  },
];

export default function TasksPage() {
  const { tasks, loading, error, refetch } = useTasks();
  const { createTask, loading: creating } = useCreateTask();
  const { completeTask, loading: completing } = useCompleteTask();
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // Use mock data if no tasks or network error
  const displayTasks = tasks.length > 0 ? tasks : mockTasks;
  const usingMockData = tasks.length === 0;

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await createTask(newTaskTitle, newTaskDescription || undefined);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowNewTask(false);
      refetch();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      refetch();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show error screen for network errors - use mock data instead
  // Only show error screen for actual API errors (not network failures)
  if (error && !error.includes('Failed to connect') && !error.includes('Failed to fetch')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const incompleteTasks = displayTasks.filter(t => !t.completed);
  const completedTasks = displayTasks.filter(t => t.completed);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
            {usingMockData && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Demo Mode:</span> Showing sample tasks. Connect to backend to see your personalized tasks.
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Global Empowerment Coach Tasks</h1>
          <button
            onClick={() => setShowNewTask(!showNewTask)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>

        {/* New Task Form */}
        {showNewTask && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Task</h2>
              <button
                onClick={() => {
                  setShowNewTask(false);
                  setNewTaskTitle('');
                  setNewTaskDescription('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Task description (optional)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTask}
                  disabled={creating || !newTaskTitle.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
                <button
                  onClick={() => {
                    setShowNewTask(false);
                    setNewTaskTitle('');
                    setNewTaskDescription('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Incomplete Tasks */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Active Tasks</h2>
          {incompleteTasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No active tasks. Great job!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-start gap-4"
                >
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={completing}
                    className="mt-1 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    <Circle className="w-6 h-6" />
                  </button>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{task.title}</h3>
                    {task.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{task.description}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created {new Date(task.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Completed Tasks</h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-start gap-4 opacity-75"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-through">{task.title}</h3>
                    {task.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-through">{task.description}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Completed {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

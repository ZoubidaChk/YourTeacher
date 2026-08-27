/* /**
 * YourTeacher - Preload Script
 * 
 * This module acts as a secure context bridge between the Main and Renderer processes.
 * It exposes a restricted API surface to the frontend to enable IPC communication
  for database operations, user management, and curriculum retrieval.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Users
  createUser: (payload) => ipcRenderer.invoke('createUser', payload),
  getUsers: () => ipcRenderer.invoke('getUsers'),
  updateUser: (user) => ipcRenderer.invoke('updateUser', user),

  // Levels & Units
  getLevels: () => ipcRenderer.invoke('getLevels'),
  getUnits: (levelCode) => ipcRenderer.invoke('getUnits', levelCode),

  // Lessons
  getLessons: (unitId) => ipcRenderer.invoke('getLessons', unitId),
  getLesson: (lessonId) => ipcRenderer.invoke('getLesson', lessonId),

  // Quiz
  getQuiz: (unitId) => ipcRenderer.invoke('getQuiz', unitId),

  // Games
  getGame: (unitId, gameType) => ipcRenderer.invoke('getGame', unitId, gameType),

  // Progress
  getProgress: (userId) => ipcRenderer.invoke('getProgress', userId),
  saveProgress: (payload) => ipcRenderer.invoke('saveProgress', payload),

  // XP
  addXp: (payload) => ipcRenderer.invoke('addXp', payload),

  // Writing prompts
  getWritingPrompts: (levelCode) => ipcRenderer.invoke('getWritingPrompts', levelCode),

  // Export
  exportProgressReport: (payload) => ipcRenderer.invoke('exportProgressReport', payload)
});

import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { TasksListPage } from '../shared/TasksListPage';
export const MyTasksPage = () => {
    const { currentUser } = useAuthStore();
    return (<div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="page-title">My Assigned Tasks</h1>
        <p className="page-subtitle">View and update all tasks assigned directly to you</p>
      </div>

      <TasksListPage />
    </div>);
};

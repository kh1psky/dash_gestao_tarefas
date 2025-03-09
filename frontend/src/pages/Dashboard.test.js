import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './Dashboard';
import { AuthProvider } from '../contexts/AuthContext';

// Mock axios
jest.mock('axios');

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'fake-token',
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('Dashboard Component', () => {
  const mockStats = {
    totalTasks: 10,
    completedTasks: 5,
    pendingTasks: 5,
  };

  const mockPendingTasks = [
    {
      _id: '1',
      title: 'Task 1',
      description: 'Description 1',
      priority: 'alta',
      dueDate: '2023-03-15T00:00:00.000Z',
      assignee: 'John Doe',
    },
    {
      _id: '2',
      title: 'Task 2',
      description: 'Description 2',
      priority: 'média',
      dueDate: '2023-03-20T00:00:00.000Z',
      assignee: 'Jane Smith',
    },
  ];

  const mockCompletedTasks = [
    {
      _id: '3',
      title: 'Task 3',
      description: 'Description 3',
      priority: 'baixa',
      completedDate: '2023-03-10T00:00:00.000Z',
      assignee: 'John Doe',
    },
  ];

  beforeEach(() => {
    // Mock axios create method
    axios.create.mockReturnValue({
      get: jest.fn().mockImplementation((url) => {
        if (url === '/tasks/stats/summary') {
          return Promise.resolve({ data: mockStats });
        } else if (url === '/tasks' && arguments[1]?.params?.status === 'pendente') {
          return Promise.resolve({ data: mockPendingTasks });
        } else if (url === '/tasks' && arguments[1]?.params?.status === 'concluída') {
          return Promise.resolve({ data: mockCompletedTasks });
        }
        return Promise.resolve({ data: [] });
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders dashboard with stats and tasks after loading', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check if stats are displayed
    expect(screen.getByText('Total de Tarefas')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Total tasks
    expect(screen.getByText('Tarefas Concluídas')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Completed tasks
    expect(screen.getByText('Tarefas Pendentes')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Pending tasks

    // Check if charts are displayed
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();

    // Check if task lists are displayed
    expect(screen.getByText('Tarefas Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();

    expect(screen.getByText('Tarefas Recentes Concluídas')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });
});
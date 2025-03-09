import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Paper, Chip, Button, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  People as PeopleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

// Styled components
const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
}));

const TaskCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  '&:last-child': {
    marginBottom: 0,
  },
}));

const PriorityChip = styled(Chip)(({ theme, priority }) => {
  const colors = {
    alta: {
      bg: theme.palette.error.light,
      color: theme.palette.error.contrastText,
    },
    média: {
      bg: theme.palette.warning.light,
      color: theme.palette.warning.contrastText,
    },
    baixa: {
      bg: theme.palette.success.light,
      color: theme.palette.success.contrastText,
    },
  };

  return {
    backgroundColor: colors[priority]?.bg || theme.palette.grey[300],
    color: colors[priority]?.color || theme.palette.text.primary,
    fontWeight: 'bold',
  };
});

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  '& svg': {
    marginRight: theme.spacing(1),
  },
}));

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    teamMembers: 5, // Hardcoded for now
  });
  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [progressData, setProgressData] = useState({
    labels: [],
    datasets: []
  });
  const { token } = useAuth();
  const navigate = useNavigate();

  // API config
  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
  });

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get task statistics
        const statsResponse = await api.get('/tasks/stats/summary');
        const statsData = statsResponse.data;
        
        setStats({
          totalTasks: statsData.totalTasks,
          completedTasks: statsData.completedTasks,
          pendingTasks: statsData.pendingTasks,
          teamMembers: 5, // Hardcoded for now
        });
        
        // Get pending tasks
        const pendingResponse = await api.get('/tasks', { 
          params: { status: 'pendente', limit: 3 } 
        });
        setPendingTasks(pendingResponse.data.slice(0, 3));
        
        // Get completed tasks
        const completedResponse = await api.get('/tasks', { 
          params: { status: 'concluída', limit: 2 } 
        });
        setCompletedTasks(completedResponse.data.slice(0, 2));
        
        // Create progress chart data (mock data for now)
        // In a real app, you would fetch historical data from the API
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        setProgressData({
          labels: months,
          datasets: [
            {
              label: 'Tarefas Concluídas',
              data: [5, 8, 12, 16, 20, statsData.completedTasks],
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
            },
            {
              label: 'Tarefas Criadas',
              data: [8, 12, 16, 20, 24, statsData.totalTasks],
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
            },
          ],
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const taskDistributionData = {
    labels: ['Concluídas', 'Pendentes'],
    datasets: [
      {
        data: [stats.completedTasks, stats.pendingTasks],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 159, 64, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const handleAddTask = () => {
    navigate('/tasks');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Total de Tarefas
              </Typography>
              <AssignmentIcon color="primary" fontSize="large" />
            </Box>
            <Typography variant="h3">{stats.totalTasks}</Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Tarefas Concluídas
              </Typography>
              <CheckCircleIcon color="success" fontSize="large" />
            </Box>
            <Typography variant="h3">{stats.completedTasks}</Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Tarefas Pendentes
              </Typography>
              <PendingIcon color="warning" fontSize="large" />
            </Box>
            <Typography variant="h3">{stats.pendingTasks}</Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard elevation={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Membros da Equipe
              </Typography>
              <PeopleIcon color="info" fontSize="large" />
            </Box>
            <Typography variant="h3">{stats.teamMembers}</Typography>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Charts and Tasks */}
      <Grid container spacing={3}>
        {/* Progress Chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <SectionTitle variant="h6">
              <AssignmentIcon />
              Progresso de Tarefas
            </SectionTitle>
            <Box sx={{ height: 300 }}>
              <Line 
                data={progressData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Task Distribution */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <SectionTitle variant="h6">
              <PieChartIcon />
              Distribuição de Tarefas
            </SectionTitle>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut 
                data={taskDistributionData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Pending Tasks */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <SectionTitle variant="h6" sx={{ mb: 0 }}>
                <PendingIcon />
                Tarefas Pendentes
              </SectionTitle>
              <Button 
                variant="contained" 
                size="small" 
                startIcon={<AddIcon />}
                onClick={handleAddTask}
              >
                Nova Tarefa
              </Button>
            </Box>
            
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <TaskCard key={task._id} elevation={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {task.title}
                    </Typography>
                    <PriorityChip
                      label={task.priority.toUpperCase()}
                      size="small"
                      priority={task.priority}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {task.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Responsável: {task.assignee}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vencimento: {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </Typography>
                  </Box>
                </TaskCard>
              ))
            ) : (
              <Typography variant="body1" sx={{ py: 2, textAlign: 'center' }}>
                Nenhuma tarefa pendente.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Completed Tasks */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <SectionTitle variant="h6">
              <CheckCircleIcon />
              Tarefas Concluídas Recentemente
            </SectionTitle>
            
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <TaskCard key={task._id} elevation={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {task.title}
                    </Typography>
                    <PriorityChip
                      label={task.priority.toUpperCase()}
                      size="small"
                      priority={task.priority}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {task.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Responsável: {task.assignee}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Concluída em: {format(new Date(task.completedDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </Typography>
                  </Box>
                </TaskCard>
              ))
            ) : (
              <Typography variant="body1" sx={{ py: 2, textAlign: 'center' }}>
                Nenhuma tarefa concluída recentemente.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Import PieChartIcon for the distribution chart section
const PieChartIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
      <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
  );
};

export default Dashboard;
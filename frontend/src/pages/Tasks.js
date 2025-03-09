import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import TaskComments from '../components/Tasks/TaskComments';

// Styled components
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

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor:
    status === 'concluída'
      ? theme.palette.success.light
      : theme.palette.warning.light,
  color:
    status === 'concluída'
      ? theme.palette.success.contrastText
      : theme.palette.warning.contrastText,
  fontWeight: 'bold',
}));

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [openTaskDetails, setOpenTaskDetails] = useState(false);
  const [detailsTabValue, setDetailsTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'todas',
    priority: 'todas',
  });
  const [openFilters, setOpenFilters] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const { token } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'média',
    assignee: '',
  });

  // API config
  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
  });

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.status !== 'todas') {
        params.status = filters.status;
      }
      
      if (filters.priority !== 'todas') {
        params.priority = filters.priority;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await api.get('/tasks', { params });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar tarefas. Por favor, tente novamente.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters, searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        dueDate: format(new Date(task.dueDate || task.completedDate), 'yyyy-MM-dd'),
        priority: task.priority,
        assignee: task.assignee,
      });
      setCurrentTask(task);
    } else {
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        priority: 'média',
        assignee: '',
      });
      setCurrentTask(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleOpenTaskDetails = (task) => {
    setCurrentTask(task);
    setOpenTaskDetails(true);
  };
  
  const handleCloseTaskDetails = () => {
    setOpenTaskDetails(false);
    setDetailsTabValue(0);
  };
  
  const handleChangeDetailsTab = (event, newValue) => {
    setDetailsTabValue(newValue);
  };

  const handleOpenDeleteDialog = (task) => {
    setCurrentTask(task);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (currentTask) {
        // Update existing task
        await api.put(`/tasks/${currentTask._id}`, {
          ...formData,
          dueDate: new Date(formData.dueDate),
        });
        
        setSnackbar({
          open: true,
          message: 'Tarefa atualizada com sucesso!',
          severity: 'success',
        });
      } else {
        // Add new task
        await api.post('/tasks', {
          ...formData,
          dueDate: new Date(formData.dueDate),
        });
        
        setSnackbar({
          open: true,
          message: 'Tarefa criada com sucesso!',
          severity: 'success',
        });
      }
      
      handleCloseDialog();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar tarefa. Por favor, tente novamente.',
        severity: 'error',
      });
    }
  };

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/tasks/${currentTask._id}`);
      
      setSnackbar({
        open: true,
        message: 'Tarefa excluída com sucesso!',
        severity: 'success',
      });
      
      handleCloseDeleteDialog();
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir tarefa. Por favor, tente novamente.',
        severity: 'error',
      });
    }
  };

  const handleMarkAsCompleted = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/complete`);
      
      setSnackbar({
        open: true,
        message: 'Tarefa marcada como concluída!',
        severity: 'success',
      });
      
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao concluir tarefa. Por favor, tente novamente.',
        severity: 'error',
      });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const toggleFilters = () => {
    setOpenFilters(!openFilters);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Pagination
  const paginatedTasks = tasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Gerenciamento de Tarefas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Tarefa
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={toggleFilters}
            >
              Filtros
            </Button>
          </Grid>
        </Grid>

        {openFilters && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  label="Status"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  <MenuItem value="pendente">Pendentes</MenuItem>
                  <MenuItem value="concluída">Concluídas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  name="priority"
                  value={filters.priority}
                  label="Prioridade"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  <MenuItem value="baixa">Baixa</MenuItem>
                  <MenuItem value="média">Média</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTasks.length > 0 ? (
                paginatedTasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell>
                      <Box 
                        component="span" 
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { textDecoration: 'underline' },
                          color: 'primary.main'
                        }}
                        onClick={() => handleOpenTaskDetails(task)}
                      >
                        {task.title}
                      </Box>
                    </TableCell>
                    <TableCell>{task.assignee}</TableCell>
                    <TableCell>
                      {format(
                        new Date(task.dueDate || task.completedDate),
                        'dd/MM/yyyy',
                        { locale: ptBR }
                      )}
                    </TableCell>
                    <TableCell>
                      <PriorityChip
                        label={task.priority.toUpperCase()}
                        size="small"
                        priority={task.priority}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        label={task.status.toUpperCase()}
                        size="small"
                        status={task.status}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {task.status !== 'concluída' && (
                          <IconButton
                            color="success"
                            onClick={() => handleMarkAsCompleted(task._id)}
                            size="small"
                            aria-label="mark as completed"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        )}
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(task)}
                          size="small"
                          aria-label="edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenDeleteDialog(task)}
                          size="small"
                          aria-label="delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      Nenhuma tarefa encontrada.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tasks.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count}`
          }
        />
      </Paper>

      {/* Add/Edit Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentTask ? 'Editar Tarefa' : 'Nova Tarefa'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Título"
            type="text"
            fullWidth
            value={formData.title}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Descrição"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="dueDate"
            label="Data de Vencimento"
            type="date"
            fullWidth
            value={formData.dueDate}
            onChange={handleInputChange}
            required
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Prioridade</InputLabel>
            <Select
              name="priority"
              value={formData.priority}
              label="Prioridade"
              onChange={handleInputChange}
            >
              <MenuItem value="baixa">Baixa</MenuItem>
              <MenuItem value="média">Média</MenuItem>
              <MenuItem value="alta">Alta</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="assignee"
            label="Responsável"
            type="text"
            fullWidth
            value={formData.assignee}
            onChange={handleInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir a tarefa "{currentTask?.title}"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDeleteTask} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog
        open={openTaskDetails}
        onClose={handleCloseTaskDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{currentTask?.title}</Typography>
            <Chip
              label={currentTask?.priority?.toUpperCase()}
              size="small"
              color={currentTask?.priority === 'alta' ? 'error' : currentTask?.priority === 'média' ? 'warning' : 'success'}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={detailsTabValue} onChange={handleChangeDetailsTab}>
              <Tab label="Detalhes" />
              <Tab label="Comentários" />
            </Tabs>
          </Box>
          
          {detailsTabValue === 0 ? (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Descrição:</Typography>
              <Typography variant="body1" paragraph>{currentTask?.description || 'Sem descrição'}</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Responsável:</Typography>
                  <Typography variant="body1">{currentTask?.assignee}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {currentTask?.status === 'concluída' ? 'Concluída em:' : 'Vencimento:'}
                  </Typography>
                  <Typography variant="body1">
                    {currentTask && format(
                      new Date(currentTask.dueDate || currentTask.completedDate),
                      'dd/MM/yyyy',
                      { locale: ptBR }
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status:</Typography>
                  <StatusChip
                    label={currentTask?.status?.toUpperCase()}
                    size="small"
                    status={currentTask?.status}
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            <TaskComments taskId={currentTask?._id} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDetails}>Fechar</Button>
          {currentTask?.status !== 'concluída' && (
            <Button 
              onClick={() => {
                handleMarkAsCompleted(currentTask._id);
                handleCloseTaskDetails();
              }} 
              color="success"
            >
              Marcar como Concluída
            </Button>
          )}
          <Button 
            onClick={() => {
              handleOpenDialog(currentTask);
              handleCloseTaskDetails();
            }} 
            color="primary"
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Tasks;
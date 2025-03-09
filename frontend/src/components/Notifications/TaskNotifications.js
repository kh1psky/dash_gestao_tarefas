import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const TaskNotifications = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  
  const open = Boolean(anchorEl);
  
  // API config
  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
  });

  // Fetch upcoming tasks for notifications
  const fetchUpcomingTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks', { 
        params: { status: 'pendente' } 
      });
      
      // Filter tasks that are due soon (within 3 days)
      const now = new Date();
      const upcomingTasks = response.data
        .filter(task => {
          const dueDate = new Date(task.dueDate);
          const daysDiff = differenceInDays(dueDate, now);
          return daysDiff >= 0 && daysDiff <= 3; // Due today or in the next 3 days
        })
        .map(task => ({
          ...task,
          read: false, // Add read status for notification
          type: 'upcoming', // Type of notification
        }));
      
      setNotifications(upcomingTasks);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingTasks();
    
    // Refresh notifications every 5 minutes
    const intervalId = setInterval(() => {
      fetchUpcomingTasks();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    
    // Mark all notifications as read
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({
        ...notification,
        read: true,
      }))
    );
  };

  const getNotificationText = (task) => {
    const dueDate = new Date(task.dueDate);
    
    if (isToday(dueDate)) {
      return `A tarefa "${task.title}" vence hoje!`;
    } else if (isTomorrow(dueDate)) {
      return `A tarefa "${task.title}" vence amanhã!`;
    } else {
      return `A tarefa "${task.title}" vence em ${differenceInDays(dueDate, new Date())} dias.`;
    }
  };

  const getNotificationIcon = (task) => {
    const dueDate = new Date(task.dueDate);
    const daysDiff = differenceInDays(dueDate, new Date());
    
    if (daysDiff === 0) {
      return <WarningIcon color="error" />;
    } else if (daysDiff === 1) {
      return <AccessTimeIcon color="warning" />;
    } else {
      return <AccessTimeIcon color="info" />;
    }
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <>
      <Tooltip title="Notificações">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ mr: 2 }}
          aria-controls={open ? 'notifications-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'notifications-button',
        }}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6">Notificações</Typography>
        </Box>
        <Divider />
        
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2">Carregando notificações...</Typography>
          </Box>
        ) : notifications.length > 0 ? (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <ListItem key={notification._id} sx={{ 
                bgcolor: notification.read ? 'transparent' : 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
              }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'background.paper' }}>
                    {getNotificationIcon(notification)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={getNotificationText(notification)}
                  secondary={format(
                    new Date(notification.dueDate),
                    'dd/MM/yyyy',
                    { locale: ptBR }
                  )}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: notification.read ? 'normal' : 'bold',
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                  }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2">Nenhuma notificação no momento.</Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default TaskNotifications;
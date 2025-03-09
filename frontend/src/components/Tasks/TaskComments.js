import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { token, user } = useAuth();

  // API config
  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
  });

  // Fetch comments for the task
  const fetchComments = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      // In a real implementation, this would be an API call to get comments
      // For now, we'll simulate with mock data
      const mockComments = [
        {
          id: 1,
          taskId,
          author: 'João Silva',
          authorInitial: 'J',
          text: 'Precisamos finalizar esta tarefa até o final da semana.',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          id: 2,
          taskId,
          author: 'Maria Oliveira',
          authorInitial: 'M',
          text: 'Estou trabalhando nisso agora, deve estar pronto amanhã.',
          createdAt: new Date(Date.now() - 43200000), // 12 hours ago
        },
      ];
      
      // Simulate API delay
      setTimeout(() => {
        setComments(mockComments);
        setLoading(false);
      }, 500);
      
      // In a real implementation, you would use:
      // const response = await api.get(`/tasks/${taskId}/comments`);
      // setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !taskId) return;
    
    try {
      setSubmitting(true);
      
      // In a real implementation, this would be an API call to post a comment
      // For now, we'll simulate with mock data
      const newCommentObj = {
        id: comments.length + 1,
        taskId,
        author: user?.name || 'Usuário',
        authorInitial: user?.name?.charAt(0) || 'U',
        text: newComment,
        createdAt: new Date(),
      };
      
      // Simulate API delay
      setTimeout(() => {
        setComments([...comments, newCommentObj]);
        setNewComment('');
        setSubmitting(false);
      }, 500);
      
      // In a real implementation, you would use:
      // await api.post(`/tasks/${taskId}/comments`, { text: newComment });
      // fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Comentários
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <List sx={{ mb: 2, maxHeight: 300, overflow: 'auto' }}>
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <React.Fragment key={comment.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {comment.authorInitial}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          {comment.author}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                      >
                        {comment.text}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < comments.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </Typography>
          )}
        </List>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          placeholder="Adicione um comentário..."
          value={newComment}
          onChange={handleCommentChange}
          onKeyPress={handleKeyPress}
          disabled={submitting}
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleSubmitComment}
          disabled={!newComment.trim() || submitting}
          sx={{ minWidth: 100, height: 40, mt: 1 }}
        >
          {submitting ? <CircularProgress size={24} /> : 'Enviar'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TaskComments;
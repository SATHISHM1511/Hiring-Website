export const setupSocket = (io) => {
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('authenticate', (userId) => {
      if (userId) {
        connectedUsers.set(userId.toString(), socket.id);
        socket.join(`user_${userId}`);
        socket.userId = userId;
        console.log(`👤 User ${userId} joined room user_${userId}`);
        socket.emit('authenticated', { success: true });
      }
    });

    socket.on('mark_notification_read', (notificationId) => {
      console.log(`📖 Notification ${notificationId} marked as read by user ${socket.userId}`);
    });

    socket.on('join_job_room', (jobId) => {
      socket.join(`job_${jobId}`);
    });

    socket.on('leave_job_room', (jobId) => {
      socket.leave(`job_${jobId}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId.toString());
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return connectedUsers;
};

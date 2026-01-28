exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

exports.formatTime = (time) => {
  return new Date(time).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

exports.isExpired = (date) => {
  return new Date(date) < new Date();
};

exports.addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

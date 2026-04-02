let currentLeaderboard = 'area';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

function switchLeaderboard(type) {
  currentLeaderboard = type;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  const metricHeader = document.getElementById('metric-header');
  if (type === 'area') {
    metricHeader.textContent = 'Territory Area (m²)';
  } else {
    metricHeader.textContent = 'Total Distance (km)';
  }

  loadLeaderboard();
  loadUserRank();
}

// Load leaderboard data
async function loadLeaderboard() {
  try {
    const endpoint = currentLeaderboard === 'area'
      ? '/api/leaderboard/area'
      : '/api/leaderboard/distance';

    const response = await axios.get(endpoint);
    const leaderboard = response.data.leaderboard;

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = leaderboard.map((user, index) => {
      const metric = currentLeaderboard === 'area'
        ? (user.total_territory_area || 0).toFixed(2) + ' m²'
        : (user.total_distance || 0).toFixed(3) + ' km';

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${user.username || 'Unknown'}</td>
          <td>${metric}</td>
          <td>${user.total_running_sessions || 0}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

// Load user rank
async function loadUserRank() {
  try {
    const token = getToken();
    if (!token) return;

    const endpoint = currentLeaderboard === 'area'
      ? '/api/leaderboard/rank/area'
      : '/api/leaderboard/rank/distance';

    const response = await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    });

    document.getElementById('your-rank').textContent = response.data.rank;
  } catch (error) {
    console.error('Error loading user rank:', error);
  }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadLeaderboard();
  loadUserRank();
});

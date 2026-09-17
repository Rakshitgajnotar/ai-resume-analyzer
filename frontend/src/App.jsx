import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Result from './pages/Result';
import History from './pages/History';
import CodingProfile from './pages/CodingProfile';
import Account from './pages/Account';

function App() {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token && token !== 'undefined' && token !== 'null';

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected App Routes wrapped inside Sidebar Layout */}
        {/* Main Dashboard route - Publicly accessible */}
        <Route
          path="/"
          element={
            <Sidebar>
              <Dashboard />
            </Sidebar>
          }
        />

        <Route
          path="/result/:id"
          element={
            isAuthenticated ? (
              <Sidebar>
                <Result />
              </Sidebar>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/history"
          element={
            isAuthenticated ? (
              <Sidebar>
                <History />
              </Sidebar>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/coding-profile"
          element={
            isAuthenticated ? (
              <Sidebar>
                <CodingProfile />
              </Sidebar>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/account"
          element={
            isAuthenticated ? (
              <Sidebar>
                <Account />
              </Sidebar>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

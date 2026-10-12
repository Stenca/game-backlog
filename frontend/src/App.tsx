import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";
import Games from "./routes/Games";
import Login from "./routes/Login";
import Register from "./routes/Register";
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        {/* <Route path="/" element={<Games />} /> */}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

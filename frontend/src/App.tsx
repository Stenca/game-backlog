import "./App.css";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Games from "./routes/Games";
import Landing from "./routes/Landing";
import Login from "./routes/Login";
import Register from "./routes/Register";
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />}></Route>
        <Route path="/login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/games" element={<Games />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

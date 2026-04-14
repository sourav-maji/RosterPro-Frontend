import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import AppRouter from "./router";

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  );
}

import Home from "./pages/Home.js";
import Analytics from "./pages/analytics.js";
import Landing from "./pages/Landing/Landing.js";
import Navbar from "./components/Navbar.js";
import Footer from "./components/Footer.js";
import Search from "./components/AdvancedSearch.js";
import Article from "./pages/DisplayArticle.js";
import LLMChat from "./components/LLMChat.js";
import ChatAssistant from "./components/ChatAssistant";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
function App() {
  return (
    <BrowserRouter>
      <Navbar></Navbar>
      <ChatAssistant/>
      <Routes>
        <Route exact path="/" element={<Landing />} />
        <Route exact path="/visualize" element={<Home />} />
        <Route exact path="/search" element={<Search />} />
        <Route exact path="/analyze" element={<Analytics />} />
        <Route path="/article/:articleId" element={<Article />} />
      </Routes>
      <Footer/>
    </BrowserRouter>
  );
}

export default App;

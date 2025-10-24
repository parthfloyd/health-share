/* eslint-disable jsx-a11y/anchor-is-valid */
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import "./Navbar.css";

const Navbar = () => {
  const handleScrollToTeam = () => {
    const teamSection = document.getElementById("team-section");
    if (teamSection) {
      teamSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  const handleScrollToAbout = () => {
    const teamSection = document.getElementById("about-section");
    if (teamSection) {
      teamSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <nav>
      <div className="nav-logo-container">
        <HealthAndSafetyIcon
          fontSize="large"
          style={{ color: "white", cursor: "pointer" }}
        />
        <a href="/" style={{ textDecoration: "none", color: "white" }}>
          HealthShare
        </a>
      </div>
      <div className="navbar-links-container">
        <a href="/">Home</a>
        <a href="/visualize">Data</a>
        <a href="/analyze">Analytics</a>
        <button onClick={handleScrollToAbout}>About</button>
        <button onClick={handleScrollToTeam}>Contact</button>

        {/* <button className="primary-button">Get Started</button> */}
      </div>
    </nav>
  );
};

export default Navbar;

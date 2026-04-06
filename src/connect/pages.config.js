/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminDashboard from './pages/AdminDashboard';
import AdminDevotionals from './pages/AdminDevotionals';
import AdminEvents from './pages/AdminEvents';
import AdminSermons from './pages/AdminSermons';
import AdminServices from './pages/AdminServices';
import Announcements from './pages/Announcements';
import Bible from './pages/Bible';
import Counseling from './pages/Counseling';
import Devotionals from './pages/Devotionals';
import Events from './pages/Events';
import Give from './pages/Give';
import Home from './pages/Home';
import LeadershipMaterials from './pages/LeadershipMaterials';
import Live from './pages/Live';
import MinistryReports from './pages/MinistryReports';
import MyNotes from './pages/MyNotes';
import PortalCallback from './pages/PortalCallback';
import PortalDashboard from './pages/PortalDashboard';
import PortalLogin from './pages/PortalLogin';
import PortalMateriales from './pages/PortalMateriales';
import PortalMiembros from './pages/PortalMiembros';
import PortalOracion from './pages/PortalOracion';
import PortalReportes from './pages/PortalReportes';
import Prayer from './pages/Prayer';
import Radio from './pages/Radio';
import Sermons from './pages/Sermons';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAnnouncements": AdminAnnouncements,
    "AdminDashboard": AdminDashboard,
    "AdminDevotionals": AdminDevotionals,
    "AdminEvents": AdminEvents,
    "AdminSermons": AdminSermons,
    "AdminServices": AdminServices,
    "Announcements": Announcements,
    "Bible": Bible,
    "Counseling": Counseling,
    "Devotionals": Devotionals,
    "Events": Events,
    "Give": Give,
    "Home": Home,
    "LeadershipMaterials": LeadershipMaterials,
    "Live": Live,
    "MinistryReports": MinistryReports,
    "MyNotes": MyNotes,
    "PortalCallback": PortalCallback,
    "PortalDashboard": PortalDashboard,
    "PortalLogin": PortalLogin,
    "PortalMateriales": PortalMateriales,
    "PortalMiembros": PortalMiembros,
    "PortalOracion": PortalOracion,
    "PortalReportes": PortalReportes,
    "Prayer": Prayer,
    "Radio": Radio,
    "Sermons": Sermons,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
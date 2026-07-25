import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CustomVoicePage from './components/CustomVoicePage';
import VoiceDesignPage from './components/VoiceDesignPage';
import VoiceClonePage from './components/VoiceClonePage';
import DesignThenClonePage from './components/DesignThenClonePage';
import FilesPage from './components/FilesPage';
import ConfigPage from './components/ConfigPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CustomVoicePage />} />
        <Route path="/voice-design" element={<VoiceDesignPage />} />
        <Route path="/voice-clone" element={<VoiceClonePage />} />
        <Route path="/design-clone" element={<DesignThenClonePage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/config" element={<ConfigPage />} />
      </Routes>
    </Layout>
  );
}

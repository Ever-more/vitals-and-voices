import { useEffect, useMemo, useState } from 'react';
import Nav from './components/Nav.jsx';
import Home from './pages/Home.jsx';
import NumbersForm from './components/NumbersForm.jsx';
import Results from './components/Results.jsx';
import Resource from './pages/Resource.jsx';
import Community from './pages/Community.jsx';
import Verify from './pages/Verify.jsx';
import { computeResults, EMPTY } from './lib/thresholds.js';
import './App.css';

// This part of the code is responsible for top-level navigation and shared state in the application.
// It handles which page is showing, the numbers a user entered, and the other lab results Gemma read, passing a go() function to every page,
// and ensures the number check, results, resources, and community all work from the same data without a full router.
export default function App() {
  const [page, setPage] = useState('home');
  const [inputs, setInputs] = useState(EMPTY);

  // This part of the code is responsible for holding the uploaded lab report in the application.
  // It handles keeping the photo or PDF the user picked on the home page until Gemma has read it,
  // and ensures the number check page can send it to Gemma once and then let it go.
  const [labPhoto, setLabPhoto] = useState(null);

  // This part of the code is responsible for remembering every other test on an uploaded report in the application.
  // It handles results like a CBC that have no built-in guideline card, along with the ranges the lab printed,
  // and ensures any kind of lab report can be explained, not just heart and metabolic numbers.
  const [extraTests, setExtraTests] = useState([]);

  // This part of the code is responsible for remembering which resource to show in the application.
  // It handles the topic picked from a "Learn more" tag or a resource card,
  // and ensures the Resource page opens the right guide.
  const [topic, setTopic] = useState('prediabetes');

  const results = useMemo(() => computeResults(inputs), [inputs]);

  const go = (next, nextTopic) => {
    if (nextTopic) setTopic(nextTopic);
    setPage(next);
  };
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);

  return (
    <div>
      <Nav page={page} go={go} />
      <main className="container page">
        {page === 'home' && (
          <Home go={go} onUpload={(file) => { setLabPhoto(file); setExtraTests([]); go('check'); }} />
        )}
        {page === 'check' && (
          <NumbersForm
            inputs={inputs}
            setInputs={setInputs}
            onSubmit={() => go('results')}
            labPhoto={labPhoto}
            onPhotoUsed={() => setLabPhoto(null)}
            extraTests={extraTests}
            setExtraTests={setExtraTests}
          />
        )}
        {page === 'results' && (
          <Results results={results} onEdit={() => go('check')} go={go} extraTests={extraTests} />
        )}
        {page === 'resource' && <Resource go={go} topic={topic} />}
        {page === 'community' && <Community go={go} />}
        {page === 'verify' && <Verify go={go} />}
      </main>
      <footer className="container footer">
        Vitals &amp; Voices is for education and support, not medical advice. In an emergency, call 911.
      </footer>
    </div>
  );
}

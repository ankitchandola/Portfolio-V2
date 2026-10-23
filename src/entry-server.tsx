import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import Home from './home/Home';
export function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );
}
// The homepage is never hydrated; src/home/client.js adds its interactions to this static markup.
export function renderHome() {
  return renderToStaticMarkup(<Home />);
}

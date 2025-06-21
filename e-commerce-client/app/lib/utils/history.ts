import { createBrowserHistory, BrowserHistory } from 'history';

let history: BrowserHistory | null = null;

if (typeof window !== 'undefined') {
  history = createBrowserHistory();
}

export { history };
export default history;

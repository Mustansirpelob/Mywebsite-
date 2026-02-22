import json
import sqlite3
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / 'database' / 'mini_ai.db'


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS knowledge (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              question TEXT NOT NULL,
              answer TEXT NOT NULL,
              created_at TEXT NOT NULL
            )
            '''
        )
        conn.commit()


def normalize(text: str) -> str:
    return ' '.join(text.lower().strip().split())


def learn(question: str, answer: str) -> None:
    q = normalize(question)
    a = answer.strip()
    if not q or not a:
        return
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            'INSERT INTO knowledge(question, answer, created_at) VALUES (?, ?, ?)',
            (q, a, datetime.utcnow().isoformat()),
        )
        conn.commit()


def lookup(message: str) -> str | None:
    msg = normalize(message)
    if not msg:
        return 'Please type a message so I can help.'

    keyword_rules = {
        'invoice': 'Invoice status: 2 paid, 1 pending review. Want me to list line items?',
        'milestone': 'Milestones: Discovery ✅ Prototype ✅ Build in progress ⏳ Launch planned next sprint.',
        'shop': 'The shop has UI kits, game logic modules, and sky/cloud asset packs.',
        'hello': 'Hey! I am Zenith Mini AI. Ask me about milestones, invoices, or project scope.',
    }

    for key, value in keyword_rules.items():
        if key in msg:
            return value

    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute('SELECT question, answer FROM knowledge ORDER BY id DESC').fetchall()

    for question, answer in rows:
        if question in msg or msg in question:
            return answer

    return None


class Handler(SimpleHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path not in ('/api/chat', '/api/teach'):
            self._send_json(404, {'error': 'Not found'})
            return

        length = int(self.headers.get('Content-Length', '0'))
        raw = self.rfile.read(length).decode('utf-8') if length else '{}'

        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            self._send_json(400, {'error': 'Invalid JSON body'})
            return

        if parsed.path == '/api/teach':
            question = str(payload.get('question', ''))
            answer = str(payload.get('answer', ''))
            if not question.strip() or not answer.strip():
                self._send_json(400, {'error': 'question and answer are required'})
                return
            learn(question, answer)
            self._send_json(200, {'ok': True, 'message': 'Learned new response.'})
            return

        message = str(payload.get('message', ''))
        learned = lookup(message)
        if learned:
            self._send_json(200, {'reply': learned, 'source': 'learned'})
            return

        self._send_json(
            200,
            {
                'reply': 'I am still learning that topic. You can teach me below with a question/answer pair.',
                'source': 'fallback',
            },
        )


if __name__ == '__main__':
    init_db()
    print('Zenith server running at http://0.0.0.0:4173')
    ThreadingHTTPServer(('0.0.0.0', 4173), Handler).serve_forever()
